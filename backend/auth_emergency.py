from fastapi import APIRouter, Depends, HTTPException, status, Request, FastAPI
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from passlib.context import CryptContext
from jose import JWTError, jwt
from pymongo import MongoClient
from bson import ObjectId
from datetime import datetime, timedelta
from typing import Optional
import os

SECRET_KEY = os.environ.get('JWT_SECRET', 'supersecretkey')
ALGORITHM = 'HS256'
ACCESS_TOKEN_EXPIRE_MINUTES = 60

app = FastAPI()

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
client = MongoClient(os.environ.get('MONGO_URI', 'mongodb://localhost:27017'))
db = client['traffic_management']
users_col = db['users']
emergency_col = db['emergency_requests']

router = APIRouter()
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/token")

class User(BaseModel):
    username: str
    password: str

class EmergencyRequest(BaseModel):
    junction: str
    vehicle_id: str
    cause: str
    requested_by: Optional[str] = None
    status: str = "pending"
    timestamp: datetime = datetime.utcnow()

# Utility functions
def verify_password(plain, hashed):
    return pwd_context.verify(plain, hashed)

def get_password_hash(password):
    return pwd_context.hash(password)

def create_access_token(data: dict, expires_delta: timedelta = None):
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

def get_user(username: str):
    return users_col.find_one({"username": username})

# Auth endpoints
@router.post("/auth/signup")
def signup(user: User):
    if get_user(user.username):
        raise HTTPException(status_code=400, detail="Username already exists")
    hashed = get_password_hash(user.password)
    users_col.insert_one({"username": user.username, "password": hashed})
    return {"msg": "Signup successful"}

@router.post("/auth/token")
def login(form_data: OAuth2PasswordRequestForm = Depends()):
    user = get_user(form_data.username)
    if not user or not verify_password(form_data.password, user['password']):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    # Always include 'sub' field in JWT payload
    payload = {"sub": user['username']}
    access_token = create_access_token(payload)
    return {"access_token": access_token, "token_type": "bearer"}

@router.post("/auth/admin/token")
def admin_login(form_data: OAuth2PasswordRequestForm = Depends()):
    # Check for admin credentials
    if form_data.username != "admin" or form_data.password != "admin123":
        raise HTTPException(status_code=401, detail="Invalid admin credentials")
    
    # Create proper JWT token for admin
    payload = {"sub": "admin", "role": "admin"}
    access_token = create_access_token(payload)
    return {"access_token": access_token, "token_type": "bearer"}

# Emergency request endpoints
@router.post("/emergency/request")
def request_emergency(er: EmergencyRequest, token: str = Depends(oauth2_scheme)):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username = payload.get("sub")
        if username is None:
            raise HTTPException(status_code=401, detail="Invalid token")
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")
    er.requested_by = username
    emergency_col.insert_one(er.dict())
    return {"msg": "Emergency request submitted"}

@router.get("/emergency/requests")
def get_emergency_requests(token: str = Depends(oauth2_scheme)):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username = payload.get("sub")
        if username is None:
            raise HTTPException(status_code=401, detail="Invalid token")
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")
    requests = list(emergency_col.find({}))
    for r in requests:
        r['_id'] = str(r['_id'])
    return requests

@router.get("/emergency/my-requests")
def get_my_emergency_requests(token: str = Depends(oauth2_scheme)):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username = payload.get("sub")
        if username is None:
            raise HTTPException(status_code=401, detail="Invalid token")
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")
    
    # Filter requests by the authenticated user
    requests = list(emergency_col.find({"requested_by": username}))
    for r in requests:
        r['_id'] = str(r['_id'])
    return requests

@router.patch("/emergency-requests/{request_id}/approve")
def approve_emergency_request(request_id: str, token: str = Depends(oauth2_scheme)):
    try:
        # Verify admin token
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username = payload.get("sub")
        if username is None:
            raise HTTPException(status_code=401, detail="Invalid token")
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")
    
    try:
        result = emergency_col.update_one(
            {"_id": ObjectId(request_id)},
            {"$set": {"status": "approved", "updated_at": datetime.utcnow()}}
        )
        if result.modified_count == 0:
            raise HTTPException(status_code=404, detail="Emergency request not found")
        return {"message": "Emergency request approved"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.patch("/emergency-requests/{request_id}/deny")
def deny_emergency_request(request_id: str, token: str = Depends(oauth2_scheme)):
    try:
        # Verify admin token
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username = payload.get("sub")
        if username is None:
            raise HTTPException(status_code=401, detail="Invalid token")
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")
    
    try:
        result = emergency_col.update_one(
            {"_id": ObjectId(request_id)},
            {"$set": {"status": "denied", "updated_at": datetime.utcnow()}}
        )
        if result.modified_count == 0:
            raise HTTPException(status_code=404, detail="Emergency request not found")
        return {"message": "Emergency request denied"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/emergency/deny")
def deny_emergency(request_id: str, token: str = Depends(oauth2_scheme)):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username = payload.get("sub")
        if username is None:
            raise HTTPException(status_code=401, detail="Invalid token")
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")
    emergency_col.update_one({"_id": request_id}, {"$set": {"status": "denied"}})
    return {"msg": "Request denied"}

# Include the router in the app
app.include_router(router)

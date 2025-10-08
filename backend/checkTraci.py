# # Step 1: Add modules to provide access to specific libraries and functions
# import os # Module provides functions to handle file paths, directories, environment variables
# import sys # Module provides access to Python-specific system parameters and functions

# # Step 2: Establish path to SUMO (SUMO_HOME)
# if 'SUMO_HOME' in os.environ:
#     tools = os.path.join(os.environ['SUMO_HOME'], 'tools')
#     sys.path.append(tools)
# else:
#     sys.exit("Please declare environment variable 'SUMO_HOME'")

# # Step 3: Add Traci module to provide access to specific libraries and functions
# import traci # Static network information (such as reading and analyzing network files)

# # Step 4: Define Sumo configuration
# Sumo_config = [
#     'sumo-gui',
#     '-c', 'traciii.sumocfg',
#     '--step-length', '0.05',
#     '--delay', '1000',
#     '--lateral-resolution', '0.1'
# ]

# # Step 5: Open connection between SUMO and Traci
# traci.start(Sumo_config)

# # Step 6: Define Variables
# vehicle_speed = 0
# total_speed = 0

# # Step 7: Define Functions

# # Step 8: Take simulation steps until there are no more vehicles in the network
# while traci.simulation.getMinExpectedNumber() > 0:
#     traci.simulationStep() # Move simulation forward 1 step
#     # Here you can decide what to do with simulation data at each step
#     if 'v1' in traci.vehicle.getIDList():
#         vehicle_speed = traci.vehicle.getSpeed('v1')
#         total_speed = total_speed + vehicle_speed
#     # step_count = step_count + 1
#         print(f"Vehicle v1 speed: {vehicle_speed} m/s")
#     if 'v2' in traci.vehicle.getIDList():
#         vehicle_speed = traci.vehicle.getSpeed('v2')
#         total_speed = total_speed + vehicle_speed
#     # step_count = step_count + 1
#         print(f"Vehicle v2 speed: {vehicle_speed} m/s") 
#     if 'v3' in traci.vehicle.getIDList():
#         vehicle_speed = traci.vehicle.getSpeed('v3')
#         total_speed = total_speed + vehicle_speed
#     # step_count = step_count + 1
#         print(f"Vehicle v3 speed: {vehicle_speed} m/s") 
# # Step 9: Close connection between SUMO and Traci
# traci.close()
import xml.etree.ElementTree as ET
import matplotlib.pyplot as plt
import matplotlib.animation as animation
import numpy as np

# --- Load SUMO network ---
net_tree = ET.parse("traciii.net.xml")
net_root = net_tree.getroot()

# Extract lane shapes
lanes = {}
for edge in net_root.findall("edge"):
    for lane in edge.findall("lane"):
        shape = lane.get("shape")
        if shape:
            points = [tuple(map(float, p.split(','))) for p in shape.split()]
            lanes[lane.get("id")] = np.array(points)

# --- Load routes ---
routes_tree = ET.parse("traciii.rou.xml")
routes_root = routes_tree.getroot()

vehicles = []
for trip in routes_root.findall("trip"):
    start_edge = trip.get("from")
    end_edge = trip.get("to")
    vehicles.append({
        "id": trip.get("id"),
        "start": start_edge,
        "end": end_edge,
        "pos": 0,  # position along lane
        "path": None
    })

# --- Assign each vehicle a lane path (using start edge for simplicity) ---
for v in vehicles:
    edge = net_root.find(f"edge[@id='{v['start']}']")
    if edge is not None:
        lane = edge.find("lane")
        if lane is not None:
            shape = lane.get("shape")
            if shape:
                v["path"] = np.array([tuple(map(float, p.split(','))) for p in shape.split()])

# --- Plot setup ---
fig, ax = plt.subplots(figsize=(8, 8))

# Draw lanes (roads)
for shape in lanes.values():
    ax.plot(shape[:, 0], shape[:, 1], 'k-', linewidth=1)

# Vehicle plots
vehicle_plots = [ax.plot([], [], 'ro', markersize=6)[0] for _ in vehicles]

ax.set_title("SUMO Network with Vehicles")
ax.axis("equal")

# --- Animation function ---
def update(frame):
    for i, v in enumerate(vehicles):
        if v["path"] is not None:
            # Move vehicle along path
            path = v["path"]
            idx = int(v["pos"]) % len(path)
            x, y = path[idx, 0], path[idx, 1]
            vehicle_plots[i].set_data([x], [y])  # <-- fixed here
            v["pos"] += 0.2  # speed factor
    return vehicle_plots


ani = animation.FuncAnimation(fig, update, frames=200, interval=100, blit=True)

# --- Save animation instead of showing interactively ---
ani.save("traffic_sim.gif", writer="pillow", fps=10)
print("✅ Animation saved as traffic_sim.gif")

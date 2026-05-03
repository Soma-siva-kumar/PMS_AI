import socketio
import time
import random

# Initialize the Socket.io client
sio = socketio.Client()

@sio.event
def connect():
    print("AI Engine connected to Server")

@sio.event
def disconnect():
    print("AI Engine disconnected")

def simulate_saline_monitoring(patient_id):
    level = 100
    print(f"Starting simulation for Patient: {patient_id}")
    
    while level > 0:
        # Emit the saline-update event to the server
        # The server will then broadcast it to the patient's room
        data = {
            'patientId': patient_id,
            'percentage': level,
            'timestamp': time.time()
        }
        sio.emit('saline-update', data)
        print(f"Emitted: {level}% for {patient_id}")
        
        # Simulate depletion
        level -= random.randint(1, 5)
        if level < 0: level = 0
        
        time.sleep(2) # Update every 2 seconds

if __name__ == '__main__':
    try:
        # Connect to the Node.js server
        sio.connect('http://localhost:5000')
        
        # Change this ID to match a patient uniqueId in your system (e.g., P101)
        target_patient_id = input("Enter Patient ID to simulate (e.g., P101): ")
        simulate_saline_monitoring(target_patient_id)
        
    except Exception as e:
        print(f"Error: {e}")
        print("Make sure the Node.js server is running and python-socketio is installed.")

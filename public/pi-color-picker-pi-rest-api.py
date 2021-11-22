###### SETUP ######
# Run the following in the commandline with the pi admin user
#   sudo python3 -m pip install flask, flask_cors
#   export FLASK_APP=pi-color-picker-pi-rest-api.py
#   flask run --host=0.0.0.0
# Enter the following URL into the PI Url input
#   at the top of the color picker website:
#   http://PIENAME.is-very-sweet.org:5000/pattern
# You should now see your canvas displayed on the pi
#   in realtime after drawing new pixels

from flask import Flask, request, jsonify
from sense_hat import SenseHat
from flask_cors import CORS, cross_origin
from flask_socketio import SocketIO
from time import sleep
import threading

sense = SenseHat()
sense.set_imu_config(True, True, True)

app = Flask(__name__)
cors = CORS(app)
#app.config['SECRET_KEY'] = 'secret!'
app.config['CORS_HEADERS'] = 'Content-Type'
socketio = SocketIO(app, cors_allowed_origins="*")

if __name__ == '__main__':
    socketio.run(app)


@app.route('/pattern', methods=['PUT'])
@cross_origin()
def result():
    body = request.json
    sense.clear()
    for y, row in body['matrix']['matrix'].items():
        for x, color in row.items():
            sense.set_pixel(int(x), int(y), color)
            pass
    return 'Ok!'


def get_sensors():
    return {
        'environmental': {
            'temperature': {
                'temperature': sense.get_temperature(),
                'humidity': sense.get_temperature_from_humidity(),
                'pressure': sense.get_temperature_from_pressure(),
            },
            'humidity': sense.get_humidity(),
            'pressure': sense.get_pressure(),
        },
        'imu': {
            'orientation': {
                'radians': sense.get_orientation_radians(),
                'degrees': sense.get_orientation_degrees(),
            },
            'compass': {
                'compass': sense.get_compass(),
                'raw': sense.get_compass_raw(),
            },
            'gyroscope': {
                'gyroscope': sense.get_gyroscope(),
                'raw': sense.get_gyroscope_raw(),
            },
            'accelerometer': {
                'accelerometer': sense.get_accelerometer(),
                'raw': sense.get_accelerometer_raw(),
            },
        },
    }


connected_users = set()


def sensor_broadcast_thread():
    global connected_users
    while len(connected_users):
        socketio.emit('sensor_data', get_sensors(), broadcast=True)
        sleep(0.2)


sensor_data_thread = threading.Thread(target=sensor_broadcast_thread)
sensor_data_thread.start()


def start_thread():
    global connected_users
    global sensor_data_thread
    if len(connected_users):
        if not sensor_data_thread.is_alive():
            sensor_data_thread = threading.Thread(
                target=sensor_broadcast_thread)
            sensor_data_thread.start()


@socketio.on('subscribe_to_sensors')
def subscribe_to_sensors():
    global connected_users
    connected_users.add(request.sid)
    start_thread()


@socketio.on('unsubscribe_from_sensors')
def unsubscribe_from_sensors():
    global connected_users
    connected_users.remove(request.sid)


@socketio.on('disconnect')
def disconnect():
    global connected_users
    connected_users.remove(request.sid)


@app.route('/sensors', methods=['GET'])
@cross_origin()
def get_sensor_data():
    return jsonify(get_sensors())

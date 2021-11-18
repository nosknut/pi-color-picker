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
sense = SenseHat()
sense.set_imu_config(True, True, True)

app = Flask(__name__)
cors = CORS(app)
app.config['CORS_HEADERS'] = 'Content-Type'


@app.route('/pattern', methods=['PUT'])
@cross_origin()
def result():
    body = request.json
    sense.clear()
    for y, row in body['matrix']['matrix'].items():
        for x, color in row.items():
            sense.set_pixel(int(x), int(y), color)
    return 'Ok!'


@app.route('/sensors', methods=['GET'])
@cross_origin()
def get_sensor_data():
    return jsonify({
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
    })

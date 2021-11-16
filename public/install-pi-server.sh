sudo python3 -m pip install flask, flask_cors
wget https://pi-color-picker.web.app/pi-color-picker-pi-rest-api.py
export FLASK_APP=pi-color-picker-pi-rest-api.py
flask run --host=0.0.0.0

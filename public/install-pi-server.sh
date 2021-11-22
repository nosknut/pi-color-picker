sudo python3 -m pip install flask flask_cors flask_socketio
wget https://pi-color-picker.web.app/pi-color-picker-pi-rest-api.py --directory-prefix=/home/pi/Documents/knut_ola/
wget https://pi-color-picker.web.app/pi-color-picker-pi-rest-api-service.service --directory-prefix=/etc/systemd/system/

systemctl start pi-color-picker-pi-rest-api-service
systemctl enable pi-color-picker-pi-rest-api-service
systemctl status pi-color-picker-pi-rest-api-service

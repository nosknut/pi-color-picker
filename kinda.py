from time import sleep
# from sense_hat import SenseHat
import math
import numpy as np

COLUMNS = 8
ROWS = 8
COLOR = (255, 0, 0)
center_x = COLUMNS // 2
center_y = ROWS // 2


class SenseHatMock():
    def __init__(self):
        self.arr = None
        self.clear()

    def set_pixel(self, x, y, color):
        self.arr[y, x] = 1

    def clear(self):
        print(self.arr)
        self.arr = np.zeros((COLUMNS, ROWS))


sense = SenseHatMock()


def clamp(value, min_value, max_value):
    return max(min_value, min(value, max_value))


def set_pixel(x, y):
    b = center_y + y
    a = clamp(b, 0, 7)
    print(a, b)
    sense.set_pixel(center_x + x, a, COLOR)


def draw_line(angle):
    within_bounds = 45 < angle < (45 + 90)
    tan = math.tan(math.radians(angle if within_bounds else angle + 90))
    for x in range(0, COLUMNS // 2):
        y = int(round(x / tan))
        a, b = (y, x) if within_bounds else (x, y)
        set_pixel(a, b)
        # if ROWS % 2 == 0:
        #     # Offset the left side of the line if the number of rows is even.
        #     # This makes the line symmetric around the point between the two center leds
        #     set_pixel(-x - 1, -y)
        # else:
        set_pixel(-a, -b)


draw_line(60)
sense.clear()

# while True:
#     sleep(1)
#     sense.clear()
#     draw_line(sense.get_temperature())

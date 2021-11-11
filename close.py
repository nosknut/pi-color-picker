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
        self.arr[x, y] = 1

    def clear(self):
        print(self.arr)
        self.arr = np.zeros((COLUMNS, ROWS))


sense = SenseHatMock()


def clamp(value, min_value, max_value):
    return max(min_value, min(value, max_value))


def set_pixel(x, y):
    b = center_y + y
    a = clamp(b, 0, 7)
    sense.set_pixel(center_x + x, a, COLOR)


def find_cat(oposing, angle):
    hyp = oposing / math.sin(math.radians(angle))
    return math.sqrt(max(0, hyp**2 - oposing**2))


def get_safe_tan(angle):
    is_upper_quarter = abs(angle % 90) >= 45
    tan = math.tan(math.radians(angle % 45))
    full_tan = 1 - tan if is_upper_quarter else tan
    print(angle, full_tan)
    return full_tan


def use_safe_tan(oposing, angle, safe_tan):
    is_upper_quarter = abs(angle % 90) >= 45
    quarter = (angle // 90) % 2
    ajacent = oposing * safe_tan
    if quarter == 0 and not is_upper_quarter:
        return -ajacent
    else:
        return ajacent


def draw_line(angle):
    tan = get_safe_tan(angle)
    for y in range(0, ROWS // 2):
        x = int(round(use_safe_tan(y, angle, tan)))
        set_pixel(x, y)
        # if ROWS % 2 == 0:
        #     # Offset the left side of the line if the number of rows is even.
        #     # This makes the line symmetric around the point between the two center leds
        #     set_pixel(-x - 1, -y)
        # else:
        set_pixel(-x, -y)


# draw_line(45)
draw_line(75)
draw_line(25)
sense.clear()

# while True:
#     sleep(1)
#     sense.clear()
#     draw_line(sense.get_temperature())

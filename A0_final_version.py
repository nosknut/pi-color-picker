from time import sleep
from sense_hat import SenseHat
import math


COLUMNS = 8
ROWS = 8

sense = SenseHat()

# Press stick down to reset orientation
# The following configurations are at the top of the file
# Uncomment the inverter if pixel rotation is oposite from physical rotation
# Uncomment the correct axis (Just test it.
#   The correct axis should have the display rotate with the
#   device. Rotate the device clockwise while looking at the display)


def knut_ola():
    global sense
    global ROWS
    global COLUMNS

    ######## Config ########
    # Uncomment if pixel rotation is oposite from physical rotation
    #invert_rotation = 1
    invert_rotation = -1

    ######## Config ########
    # Uncomment the correct axis
    AXIS = "pitch"
    #AXIS = "yaw"
    #AXIS = "roll"

    COLOR = (255, 0, 0)
    BLACK = (0, 0, 0)
    center_x = COLUMNS // 2
    center_y = ROWS // 2

    class SenseBuffer():
        def __init__(self, sense):
            self.arr = []
            self.sense = sense
            self.clear()

        def set_pixel(self, x, y, color):
            self.arr[(y * COLUMNS) + x] = color

        def clear(self):
            self.arr = []
            for i in range(0, COLUMNS * ROWS):
                self.arr.append(BLACK)

        def draw(self):
            self.sense.set_pixels(self.arr)

    sense_buffer = SenseBuffer(sense)

    def set_pixel(x, y):
        global pixels
        absolute_x = center_x + x
        absolute_y = center_y - y
        if (0 <= absolute_x <= (COLUMNS - 1)) and (0 <= absolute_y <= (ROWS - 1)):
            sense_buffer.set_pixel(absolute_x, absolute_y, COLOR)

    """
        a version of the tangent function where
        tan(angle) is symmetric around tan(45deg) 
        and zero at tan(0deg) and tan(90deg)
    """

    def get_continious_tan(angle):
        small_angle = angle % 45
        is_upper = abs(angle % 90) >= 45
        tan = math.tan(math.radians(small_angle))
        return 1 - tan if is_upper else tan

    """
        flips the axis generated by the continious_tangent function
        to create a continious circulat motion
    """

    def handle_odd_quarter(angle, x, y):
        is_odd_quarter = abs(angle // 90) % 2
        # angles in quadrant zero and two are mirrored
        # in quadrants one and three, the x value should decrease from zero, rather than decrease from max
        return (-y, x) if is_odd_quarter else (x, y)

    def make_continious(ajacent, angle, tan):
        is_upper = abs(angle % 90) > 45
        oposing = int(round(ajacent * tan))
        if is_upper:
            # In the upper portion of a quadrant the x value will decrease with the tangent, while the y value will increase independently
            return handle_odd_quarter(angle, oposing, ajacent)
        # In the upper portion of a quadrant the y value will increase with the tangent, while the x value will decrease independently
        return handle_odd_quarter(angle, ajacent, oposing)

    def draw_water(angle, x, y):
        translate_direction = -1 if 135 <= abs(angle % 360) < 315 else 1
        translate_on_x = 45 < abs(angle % 180) < 135
        for offset in range(0, (COLUMNS if translate_on_x else ROWS) + 1):
            directional_offset = offset * translate_direction
            if translate_on_x:
                # TODO: Why must x be subtracted from instead of added?
                set_pixel(x - directional_offset, y)
            else:
                set_pixel(x, y + directional_offset)

    def draw_horizon(angle):
        tan = get_continious_tan(angle)
        for x in range(-(center_x + 1), (center_x + 2)):
            x2, y = make_continious(x, angle, tan)
            draw_water(angle, x2, y + 1)

    # Sense setup
    sense.set_rotation(90)
    sense.set_imu_config(False, True, False)

    # Main Loop
    offset = 0
    angle = 0
    while True:
        sleep(0.1)
        new_angle = round(sense.get_orientation_degrees()['pitch'], 1)
        if sense.stick.direction_down:
            offset = angle
        if angle != new_angle:
            angle = new_angle
            sense_buffer.clear()
            draw_horizon(invert_rotation * (angle - offset))
            sense_buffer.draw()


knut_ola()

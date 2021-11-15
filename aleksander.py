from sense_hat import SenseHat
from time import sleep
sense = SenseHat()
pixel_list = sense.get_pixels()


def aleksander():
    sense.set_rotation(270)
    W = (255, 255, 255)
    B = (0, 0, 0)
    p = (51, 0, 102)
    b = (0, 0, 255)
    y = (255, 255, 0)
    o = (255, 69, 0)
    r = (255, 0, 0)

    def getTemperature():
        temperature = round(sense.get_temperature())
        if temperature <= 31:
            back_colour = p
        elif 31 < temperature <= 32:
            back_colour = b
        elif 32 < temperature <= 33:
            back_colour = y
        elif 33 < temperature <= 34:
            back_colour = o
        elif temperature > 34:
            back_colour = r

        speed = 0.05
        sense.show_message("The Temp is: " + str(temperature) +
                           "C", speed, text_colour=W, back_colour=back_colour)
        return temperature

    temperature = getTemperature()
    myImage = [
        B, B, W, W, W, W, B, B,
        B, B, W, B, B, W, B, B,
        B, B, W, B, B, W, B, B,
        B, B, W, B, B, W, B, B,
        B, B, W, B, B, W, B, B,
        B, W, B, B, B, B, W, B,
        B, W, B, B, B, B, W, B,
        B, B, W, W, W, W, B, B,
    ]

    def plot_ranges(color):
        color_ranges = {
            p: [(50, 54), (42, 46)],
            b: [(35, 37)],
            y: [(27, 29)],
            o: [(19, 21)],
            r: [(11, 13)],
        }
        for (start, end) in color_ranges[color]:
            for i in range(start, end):
                myImage[i] = color

        sense.set_pixels(myImage)
        sleep(1)

    if temperature <= 31:
        plot_ranges(p)

    elif 31 < temperature <= 32:
        plot_ranges(p)
        plot_ranges(b)

    elif 32 < temperature <= 33:
        plot_ranges(p)
        plot_ranges(b)
        plot_ranges(y)

    elif 33 < temperature <= 34:
        plot_ranges(p)
        plot_ranges(b)
        plot_ranges(y)
        plot_ranges(o)

    elif 34 < temperature <= 39:
        plot_ranges(p)
        plot_ranges(b)
        plot_ranges(y)
        plot_ranges(o)
        plot_ranges(r)

    elif temperature >= 40:
        plot_ranges(p)
        plot_ranges(b)
        plot_ranges(y)
        plot_ranges(o)
        plot_ranges(r)
        for n in range(2, 6):
            myImage[n] = r
        myImage[9] = r
        myImage[14] = r
        myImage[16] = r
        myImage[22] = r

    sense.set_pixels(myImage)
    sleep(3)


aleksander()

import os
import json


def living_function():
    return os.getcwd()


def dead_function():
    return json.dumps({"a": 1})


def another_dead():
    return 42


class DeadClass:
    pass


class LivingClass:
    def method(self):
        return living_function()


instance = LivingClass()

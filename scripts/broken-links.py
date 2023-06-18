import json
import time
from urllib.request import urlopen

with open('js/current-films.js', mode='r') as file:
    file_content = file.read()

films = json.loads(file_content[19:])

for film in films:
    time.sleep(1)
    if film['lomography']:
        try:
            with urlopen(film['lomography']) as response:
                print(film['name'] + ' ✓')
        except:
            print(film['name'] + ' ✗ - ' + film['lomography'])

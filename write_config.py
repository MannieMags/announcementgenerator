import os
import json
key = os.environ.get('PANGEA_API_KEY', '')
with open('config.js', 'w') as f:
    f.write('window.PANGEA_CONFIG = { apiKey: ' + json.dumps(key) + ' };\n')

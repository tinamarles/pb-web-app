# Source - https://stackoverflow.com/a/79723581
# Posted by Wesley
# Retrieved 2026-02-02, License - CC BY-SA 4.0

from importlib.metadata import distributions  
import os
import datetime

dist_infos = []
for dist in distributions():
    dist_info = {
        "t": datetime.datetime.fromtimestamp(os.path.getctime(dist._path)),
        "n": dist.metadata["Name"],
        "v": dist.version,
    }
    dist_infos.append(dist_info)

info_sorted_by_date = sorted(dist_infos, key=lambda i: i['t'])
for i in info_sorted_by_date:
    print(i['t'], i['n'], i['v'])


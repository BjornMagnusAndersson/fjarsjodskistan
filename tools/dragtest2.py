# Same test against the PREVIOUS published logic is not possible; instead test the old rule numerically:
r = [115.09375, 395.015625, 229.3125, 447.1875]
x = r[0]+r[2]*.2-30
print('old rule would re-equip:', r[0]+r[2]*.08-20 <= x <= r[0]+r[2]*.92+20)

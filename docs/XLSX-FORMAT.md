# Excel Import / Export Format

The exported workbook contains a `Scout Reports` worksheet. The first row contains:

`id, farmId, farmName, cropType, variety, isGreenhouse, reportDate, implementationWeek, implementationYear, weather, temperature, humidity, notes, status, pestCount, diseaseCount`

For imports, the required fields are:
- `farmId`
- `farmName`
- `cropType`
- `reportDate`

The server validates all imported values through the existing report store. Status is not used to bypass workflow verification; new imported reports begin as workflow drafts.

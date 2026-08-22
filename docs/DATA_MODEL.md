# DATA MODEL

## Suerte
Campos centrales:
`id`, `legacyId`, `farmCode`, `producer`, `lot`, `area`, `variety`, `rowSpacingM`,
`plantingDate`, `lastCutDate`, `zone`, `tenureCode`, `tenureLabel`, `irrigation`,
`historicalTch`, `latestSeasonTch`.

## Biometría
Además de identificación de suerte:
`currentAgeMonths`, `targetAgeMonths`, `adjustmentPct`, `biometricTch`, `projectedTch`,
`projectedTons`, `weightTch`, `weightPointCount`, `cvPct`, `quality`, `validation`, `samples`.

## Punto v2.4
`pointCode`, `sampleLengthM`, `stalkCount` o `directStalksPerMeter`,
`heightM`, `diameterMm`, `rowSpacingM`, `tch`,
`weighingEnabled`, `weighedStalkCount`, `weighedTotalKg`, `averageStalkWeightKg`, `weightTch`,
GPS y observaciones.

Campos legacy `lengthCm` y `diameterCm` se conservan en registros guardados para compatibilidad.

## Visita de campo v2.5.1

`id`, `date`, `time`, `technician`, identificación completa de suerte, `purpose`,
`overallCondition`, `waterStatus`, `weedLevel`, `pestLevel`, `lodgingPct`,
`tchSource`, `estimatedTch`, GPS, `notes`, `photos`, `datasetVersion`.

Cada fotografía contiene `id`, `dataUrl` JPEG optimizado, dimensiones, tamaño,
nombre original y fecha de captura. La copia rotulada no se guarda: se genera como PNG al exportar.
La visita exige al menos una fotografía, pero permite agregar todas las necesarias según el espacio disponible del dispositivo.

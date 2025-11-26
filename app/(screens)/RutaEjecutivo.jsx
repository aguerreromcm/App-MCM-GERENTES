import { useState, useEffect, useContext } from "react"
import { View, Text, StatusBar, ActivityIndicator, Alert, Pressable } from "react-native"
import { WebView } from "react-native-webview"
import { useLocalSearchParams, router } from "expo-router"
import { COLORS, FONTS } from "../../constants"
import { SafeAreaInsetsContext } from "react-native-safe-area-context"
import { MaterialIcons, Feather } from "@expo/vector-icons"
import { rutaCobranzaEjecutivo } from "../../services"
import { useSession } from "../../context/SessionContext"
import numeral from "numeral"

export default function RutaEjecutivo() {
    const { ejecutivo, nombre, fecha } = useLocalSearchParams()
    const [rutaData, setRutaData] = useState(null)
    const [loading, setLoading] = useState(true)
    const { keyMaps } = useSession()
    const insets = useContext(SafeAreaInsetsContext)

    const obtenerFechaActual = () => {
        const f = fecha ? new Date(fecha) : new Date()
        return (
            f.getUTCDate().toString().padStart(2, "0") +
            "/" +
            (f.getUTCMonth() + 1).toString().padStart(2, "0") +
            "/" +
            f.getUTCFullYear().toString()
        )
    }

    const obtenerRutaEjecutivo = async () => {
        try {
            setLoading(true)
            const fechaConsulta = fecha || obtenerFechaActual()
            const response = await rutaCobranzaEjecutivo.obtener(ejecutivo, fechaConsulta)

            if (response.success) {
                setRutaData(response.data)
            } else {
                console.log("Error en respuesta:", response.error)
                Alert.alert("Error", response.error || "No se pudo obtener la ruta del ejecutivo")
            }
        } catch (error) {
            console.error("Error al obtener ruta:", error)
            Alert.alert("Error", "Error inesperado al obtener la ruta")
        } finally {
            setLoading(false)
        }
    }

    const volverAlDetalle = () => {
        router.back()
    }

    const generarHTMLMapa = () => {
        if (!rutaData || !rutaData.features) {
            return `
                <html>
                    <body>
                        <div style="display: flex; justify-content: center; align-items: center; height: 100vh; font-family: Arial, sans-serif;">
                            <p>No hay datos de ruta disponibles</p>
                        </div>
                    </body>
                </html>
            `
        }

        if (!keyMaps) {
            return `
                <html>
                    <body>
                        <div style="display: flex; justify-content: center; align-items: center; height: 100vh; font-family: Arial, sans-serif;">
                            <p>API Key de Google Maps no disponible</p>
                        </div>
                    </body>
                </html>
            `
        }

        const puntos = rutaData.features.filter((feature) => feature.geometry.type === "Point")
        const lineas = rutaData.features.filter((feature) => feature.geometry.type === "LineString")

        // Calcular centro del mapa
        if (puntos.length === 0) {
            return `
                <html>
                    <body>
                        <div style="display: flex; justify-content: center; align-items: center; height: 100vh; font-family: Arial, sans-serif;">
                            <p>No hay puntos de ruta disponibles</p>
                        </div>
                    </body>
                </html>
            `
        }

        const coordenadas = puntos.map((punto) => ({
            lat: parseFloat(punto.geometry.coordinates[1]),
            lng: parseFloat(punto.geometry.coordinates[0])
        }))

        const latitudes = coordenadas.map((coord) => coord.lat)
        const longitudes = coordenadas.map((coord) => coord.lng)

        const centroLat = latitudes.reduce((sum, lat) => sum + lat, 0) / latitudes.length
        const centroLng = longitudes.reduce((sum, lng) => sum + lng, 0) / longitudes.length

        // Generar marcadores
        const marcadores = puntos
            .map((punto) => {
                const { coordinates } = punto.geometry
                const { properties } = punto
                return `
                var marker${properties.numero} = new google.maps.Marker({
                    position: { lat: ${parseFloat(coordinates[1])}, lng: ${parseFloat(
                    coordinates[0]
                )} },
                    map: map,
                    title: "${properties.nombre}",
                    label: {
                        text: "${properties.numero}",
                        color: "white",
                        fontWeight: "bold"
                    },
                    icon: {
                        path: google.maps.SymbolPath.CIRCLE,
                        scale: 20,
                        fillColor: "${properties.color || "#a93439"}",
                        fillOpacity: 1,
                        strokeWeight: 2,
                        strokeColor: "#ffffff"
                    }
                });

                var infoWindow${properties.numero} = new google.maps.InfoWindow({
                    content: \`
                        <div style="font-family: Arial, sans-serif;">
                            <h4 style="margin: 0 0 8px 0;">${properties.nombre}</h4>
                            <p style="margin: 4px 0;"><strong>Tipo:</strong> ${properties.tipo}</p>
                            <p style="margin: 4px 0;"><strong>Monto:</strong> $${numeral(
                                properties.monto
                            ).format("0,0.00")}</p>
                            <p style="margin: 4px 0;"><strong>Fecha:</strong> ${
                                properties.fecha
                            }</p>
                            <p style="margin: 4px 0;"><strong>Registro:</strong> ${
                                properties.fregistro
                            }</p>
                        </div>
                    \`
                });

                marker${properties.numero}.addListener('click', function() {
                    infoWindow${properties.numero}.open(map, marker${properties.numero});
                });
            `
            })
            .join("\n")

        // Generar polylines
        const polylines = lineas
            .map((linea, index) => {
                const coordinates = linea.geometry.coordinates
                    .map(
                        (coord) => `{ lat: ${parseFloat(coord[1])}, lng: ${parseFloat(coord[0])} }`
                    )
                    .join(", ")

                return `
                var polyline${index} = new google.maps.Polyline({
                    path: [${coordinates}],
                    geodesic: true,
                    strokeColor: '${linea.properties.color || "#0000FF"}',
                    strokeOpacity: 1.0,
                    strokeWeight: 3
                });
                polyline${index}.setMap(map);
            `
            })
            .join("\n")

        return `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Ruta de Cobranza</title>
                <style>
                    body { margin: 0; padding: 0; }
                    #map { height: 100vh; width: 100%; }
                </style>
            </head>
            <body>
                <div id="map"></div>
                <script>
                    function initMap() {
                        var map = new google.maps.Map(document.getElementById('map'), {
                            zoom: 13,
                            center: { lat: ${centroLat}, lng: ${centroLng} },
                            mapTypeId: 'roadmap'
                        });

                        ${marcadores}
                        ${polylines}

                        // Ajustar el zoom para mostrar todos los marcadores
                        var bounds = new google.maps.LatLngBounds();
                        ${puntos
                            .map(
                                (punto) =>
                                    `bounds.extend(new google.maps.LatLng(${parseFloat(
                                        punto.geometry.coordinates[1]
                                    )}, ${parseFloat(punto.geometry.coordinates[0])}));`
                            )
                            .join("\n                        ")}
                        map.fitBounds(bounds);
                        
                        // Asegurar un zoom mínimo
                        google.maps.event.addListenerOnce(map, 'bounds_changed', function() {
                            if (map.getZoom() > 18) {
                                map.setZoom(18);
                            }
                        });
                    }
                </script>
                <script async defer
                    src="https://maps.googleapis.com/maps/api/js?key=${keyMaps}&callback=initMap">
                </script>
            </body>
            </html>
        `
    }

    const renderEstadisticas = () => {
        if (!rutaData || !rutaData.features) return null

        const puntos = rutaData.features.filter((feature) => feature.geometry.type === "Point")
        const totalPuntos = puntos.length
        const montoTotal = puntos.reduce((sum, feature) => sum + (feature.properties.monto || 0), 0)

        return (
            <View
                style={{
                    backgroundColor: COLORS.white,
                    borderRadius: 12,
                    padding: 16,
                    marginHorizontal: 20,
                    marginVertical: 16,
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.2,
                    shadowRadius: 8,
                    elevation: 8
                }}
            >
                <Text
                    style={{
                        ...FONTS.h4,
                        color: COLORS.black,
                        marginBottom: 12,
                        fontWeight: "600"
                    }}
                >
                    Resumen de la Ruta
                </Text>
                <View
                    style={{
                        flexDirection: "row",
                        justifyContent: "space-around"
                    }}
                >
                    <View style={{ alignItems: "center" }}>
                        <Text
                            style={{
                                ...FONTS.h3,
                                color: COLORS.primary,
                                fontWeight: "bold"
                            }}
                        >
                            {totalPuntos}
                        </Text>
                        <Text style={{ ...FONTS.body4, color: COLORS.gray3 }}>Paradas</Text>
                    </View>
                    <View style={{ alignItems: "center" }}>
                        <Text
                            style={{
                                ...FONTS.h3,
                                color: COLORS.success,
                                fontWeight: "bold"
                            }}
                        >
                            ${numeral(montoTotal).format("0,0")}
                        </Text>
                        <Text style={{ ...FONTS.body4, color: COLORS.gray3 }}>Total</Text>
                    </View>
                </View>
            </View>
        )
    }

    useEffect(() => {
        if (ejecutivo) {
            obtenerRutaEjecutivo()
        }
    }, [ejecutivo])

    if (loading) {
        return (
            <View
                style={{
                    flex: 1,
                    backgroundColor: COLORS.white,
                    justifyContent: "center",
                    alignItems: "center"
                }}
            >
                <StatusBar backgroundColor={COLORS.white} barStyle="dark-content" />
                <ActivityIndicator size="large" color={COLORS.primary} />
                <Text
                    style={{
                        ...FONTS.body3,
                        color: COLORS.gray3,
                        marginTop: 16
                    }}
                >
                    Cargando ruta...
                </Text>
            </View>
        )
    }

    return (
        <View
            className="flex-1 bg-primary"
            style={{
                paddingTop: insets.top
            }}
        >
            <View className="flex-row items-center p-4">
                <Pressable onPress={volverAlDetalle} className="mr-4">
                    <Feather name="arrow-left" size={24} color="white" />
                </Pressable>
                <Text className="flex-1 text-white text-lg font-semibold">Ruta de Cobranza</Text>
            </View>
            <View className="bg-white flex-1 rounded-t-3xl">
                <View className="p-4 border-b border-gray-200">
                    <View className="flex-row justify-between items-start">
                        <View className="flex-1">
                            <Text className="text-2xl font-bold text-gray-800">{nombre}</Text>
                            <Text className="text-base text-gray-600">{obtenerFechaActual()}</Text>
                        </View>
                    </View>
                </View>

                {/* Mapa de Google Maps en WebView */}
                {rutaData && rutaData.features ? (
                    <View style={{ flex: 1 }}>
                        {renderEstadisticas()}
                        <View
                            style={{
                                flex: 1,
                                marginHorizontal: 20,
                                marginBottom: 20,
                                borderRadius: 12,
                                overflow: "hidden"
                            }}
                        >
                            <WebView
                                source={{ html: generarHTMLMapa() }}
                                style={{ flex: 1 }}
                                javaScriptEnabled={true}
                                domStorageEnabled={true}
                                startInLoadingState={true}
                                onError={(syntheticEvent) => {
                                    const { nativeEvent } = syntheticEvent
                                    console.log("WebView error: ", nativeEvent)
                                }}
                                onHttpError={(syntheticEvent) => {
                                    const { nativeEvent } = syntheticEvent
                                    console.log("WebView HTTP error: ", nativeEvent)
                                }}
                                renderLoading={() => (
                                    <View
                                        style={{
                                            position: "absolute",
                                            top: 0,
                                            left: 0,
                                            right: 0,
                                            bottom: 0,
                                            justifyContent: "center",
                                            alignItems: "center",
                                            backgroundColor: COLORS.white
                                        }}
                                    >
                                        <ActivityIndicator size="large" color={COLORS.primary} />
                                        <Text
                                            style={{
                                                ...FONTS.body4,
                                                color: COLORS.gray3,
                                                marginTop: 8
                                            }}
                                        >
                                            Cargando mapa...
                                        </Text>
                                    </View>
                                )}
                            />
                        </View>
                    </View>
                ) : (
                    (() => {
                        console.log(
                            "Condición de sin datos - rutaData:",
                            !!rutaData,
                            "features:",
                            !!rutaData?.features
                        )
                        return (
                            <View
                                style={{
                                    flex: 1,
                                    justifyContent: "center",
                                    alignItems: "center",
                                    backgroundColor: COLORS.grayscale100
                                }}
                            >
                                <MaterialIcons name="route" size={64} color={COLORS.gray3} />
                                <Text
                                    style={{
                                        ...FONTS.h4,
                                        color: COLORS.black,
                                        marginTop: 16,
                                        marginBottom: 8
                                    }}
                                >
                                    Sin datos de ruta
                                </Text>
                                <Text
                                    style={{
                                        ...FONTS.body4,
                                        color: COLORS.gray3,
                                        textAlign: "center",
                                        marginHorizontal: 40
                                    }}
                                >
                                    No se encontraron datos de ruta para este ejecutivo en la fecha
                                    seleccionada
                                </Text>
                            </View>
                        )
                    })()
                )}
            </View>
        </View>
    )
}

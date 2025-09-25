import { useState, useContext, useEffect } from "react"
import { View, Text, StatusBar, ScrollView, Pressable, ActivityIndicator } from "react-native"
import { SafeAreaInsetsContext } from "react-native-safe-area-context"
import { useLocalSearchParams, router } from "expo-router"
import { MaterialIcons, Feather } from "@expo/vector-icons"

import { COLORS, FONTS } from "../../constants"
import { detalleSemanalEjecutivo } from "../../services"
import numeral from "numeral"

numeral.zeroFormat(0)
numeral.nullFormat(0)

export default function DetalleEjecutivo() {
    const { ejecutivo, dia, fecha } = useLocalSearchParams()
    const [datosEjecutivo, setDatosEjecutivo] = useState(null)
    const [creditosDelDia, setCreditosDelDia] = useState([])
    const [loading, setLoading] = useState(true)
    const [loadingCreditos, setLoadingCreditos] = useState(false)
    const insets = useContext(SafeAreaInsetsContext)

    useEffect(() => {
        if (ejecutivo) {
            try {
                const datos = JSON.parse(ejecutivo)
                setDatosEjecutivo(datos)
                setLoading(false)
                // Cargar detalles de créditos para el día específico
                cargarCreditosDelDia(datos.ASESOR, dia)
            } catch (error) {
                console.error("Error al parsear datos del ejecutivo:", error)
                setLoading(false)
            }
        }
    }, [ejecutivo, dia])

    const cargarCreditosDelDia = async (codigoEjecutivo, diaSeleccionado) => {
        try {
            setLoadingCreditos(true)
            const response = await detalleSemanalEjecutivo.obtener(codigoEjecutivo)

            if (response.success && response.data?.cobranza_semana) {
                // Mapeo de días en español a días en el JSON de respuesta
                const mapaDias = {
                    LUNES: "LUNES",
                    MARTES: "MARTES",
                    MIÉRCOLES: "MIERCOLES",
                    MIERCOLES: "MIERCOLES",
                    JUEVES: "JUEVES",
                    VIERNES: "VIERNES",
                    SÁBADO: "SABADO",
                    SABADO: "SABADO",
                    DOMINGO: "DOMINGO"
                }

                const diaFiltrar =
                    mapaDias[diaSeleccionado.toUpperCase()] || diaSeleccionado.toUpperCase()

                // Filtrar créditos por el día específico
                const creditosFiltrados = response.data.cobranza_semana.filter(
                    (credito) => credito.dia_semana === diaFiltrar
                )

                setCreditosDelDia(creditosFiltrados)
            }
        } catch (error) {
            console.error("Error al cargar créditos del día:", error)
        } finally {
            setLoadingCreditos(false)
        }
    }

    const verRutaEjecutivo = () => {
        if (datosEjecutivo) {
            router.push({
                pathname: "/(screens)/RutaEjecutivo",
                params: {
                    ejecutivo: datosEjecutivo.ASESOR,
                    nombre: datosEjecutivo.NOMBRE_ASESOR,
                    fecha: fecha
                }
            })
        }
    }

    const getDisplayDate = (dateString) => {
        const dateParts = dateString.split("-")
        if (dateParts.length !== 3) return dateString // Retorna el string original si la fecha no es válida

        const [year, month, day] = dateParts.map(Number)
        const date = new Date(year, month - 1, day)
        if (isNaN(date)) return dateString // Retorna el string original si la fecha no es válida

        return date.toLocaleDateString("es-MX", {
            year: "numeric",
            month: "2-digit",
            day: "2-digit"
        })
    }

    const volverAlResumen = () => {
        router.back()
    }

    const renderInfoCard = (titulo, valor, icono, color = COLORS.primary) => {
        return (
            <View className="w-[48%] bg-blue-50 p-4 rounded-xl mb-3">
                <View className="flex-row items-center mb-2">
                    <MaterialIcons name={icono} size={20} color={color} />
                    <Text
                        className="text-sm font-medium text-gray-700 ml-2 flex-shrink"
                        numberOfLines={2}
                    >
                        {titulo}
                    </Text>
                </View>
                <Text className="text-xl font-bold text-gray-800">{valor}</Text>
            </View>
        )
    }

    const renderEstadisticasCard = () => {
        if (!datosEjecutivo) return null

        const porcentajeCompletado =
            datosEjecutivo.PAGOS_DEL_DIA > 0
                ? (datosEjecutivo.PAGOS_COBRADOS / datosEjecutivo.PAGOS_DEL_DIA) * 100
                : 0

        return (
            <View className="bg-blue-50 rounded-2xl p-4">
                <Text
                    style={{
                        ...FONTS.h4,
                        color: COLORS.black,
                        fontWeight: "600",
                        marginBottom: 16
                    }}
                >
                    Estadísticas del Día
                </Text>

                <View
                    style={{
                        flexDirection: "row",
                        justifyContent: "space-between",
                        marginBottom: 12
                    }}
                >
                    <Text style={{ ...FONTS.body3, color: COLORS.gray3 }}>
                        Progreso de Cobranza
                    </Text>
                    <Text
                        style={{
                            ...FONTS.body3,
                            color:
                                porcentajeCompletado >= 80
                                    ? COLORS.success
                                    : porcentajeCompletado >= 50
                                    ? COLORS.warning
                                    : COLORS.error,
                            fontWeight: "600"
                        }}
                    >
                        {porcentajeCompletado.toFixed(1)}%
                    </Text>
                </View>

                <View
                    style={{
                        height: 8,
                        backgroundColor: COLORS.greyscale300,
                        borderRadius: 4,
                        marginBottom: 20
                    }}
                >
                    <View
                        style={{
                            height: 8,
                            width: `${Math.max(0, Math.min(100, porcentajeCompletado))}%`,
                            backgroundColor:
                                porcentajeCompletado >= 80
                                    ? COLORS.success
                                    : porcentajeCompletado >= 50
                                    ? COLORS.warning
                                    : COLORS.error,
                            borderRadius: 4
                        }}
                    />
                </View>

                <View
                    style={{
                        flexDirection: "row",
                        justifyContent: "space-around",
                        paddingTop: 12,
                        borderTopWidth: 1,
                        borderTopColor: COLORS.greyscale300
                    }}
                >
                    <View style={{ alignItems: "center" }}>
                        <Text
                            style={{
                                ...FONTS.h3,
                                color: COLORS.success,
                                fontWeight: "700"
                            }}
                        >
                            {datosEjecutivo.PAGOS_COBRADOS}
                        </Text>
                        <Text style={{ ...FONTS.body4, color: COLORS.gray3 }}>Cobrados</Text>
                    </View>
                    <View style={{ alignItems: "center" }}>
                        <Text
                            style={{
                                ...FONTS.h3,
                                color: COLORS.error,
                                fontWeight: "700"
                            }}
                        >
                            {datosEjecutivo.PAGOS_PENDIENTES}
                        </Text>
                        <Text style={{ ...FONTS.body4, color: COLORS.gray3 }}>Pendientes</Text>
                    </View>
                    <View style={{ alignItems: "center" }}>
                        <Text
                            style={{
                                ...FONTS.h3,
                                color: COLORS.primary,
                                fontWeight: "700"
                            }}
                        >
                            {datosEjecutivo.PAGOS_DEL_DIA}
                        </Text>
                        <Text style={{ ...FONTS.body4, color: COLORS.gray3 }}>Total</Text>
                    </View>
                </View>
            </View>
        )
    }

    const renderCreditosDelDia = () => {
        if (creditosDelDia.length === 0 && !loadingCreditos) {
            return (
                <View
                    style={{
                        backgroundColor: COLORS.white,
                        borderRadius: 12,
                        padding: 20,
                        marginVertical: 16,
                        shadowColor: "#000",
                        shadowOffset: { width: 0, height: 2 },
                        shadowOpacity: 0.1,
                        shadowRadius: 4,
                        elevation: 3,
                        alignItems: "center"
                    }}
                >
                    <MaterialIcons name="credit-card" size={48} color={COLORS.gray3} />
                    <Text
                        style={{
                            ...FONTS.h4,
                            color: COLORS.black,
                            marginTop: 12,
                            marginBottom: 8
                        }}
                    >
                        Sin créditos para {dia}
                    </Text>
                    <Text
                        style={{
                            ...FONTS.body4,
                            color: COLORS.gray3,
                            textAlign: "center"
                        }}
                    >
                        No hay créditos programados para este día
                    </Text>
                </View>
            )
        }

        if (loadingCreditos) {
            return (
                <View
                    style={{
                        backgroundColor: COLORS.white,
                        borderRadius: 12,
                        padding: 20,
                        marginVertical: 16,
                        shadowColor: "#000",
                        shadowOffset: { width: 0, height: 2 },
                        shadowOpacity: 0.1,
                        shadowRadius: 4,
                        elevation: 3,
                        alignItems: "center"
                    }}
                >
                    <ActivityIndicator size="large" color={COLORS.primary} />
                    <Text
                        style={{
                            ...FONTS.body4,
                            color: COLORS.gray3,
                            marginTop: 12,
                            textAlign: "center"
                        }}
                    >
                        Cargando créditos del día...
                    </Text>
                </View>
            )
        }

        // Función para obtener el color del borde basado en los montos
        const obtenerColorBorde = (credito) => {
            const montoEsperado = credito.monto_esperado || 0
            const montoPagado = credito.monto_pagado || 0

            if (montoPagado === 0) {
                return COLORS.warning // Amarillo - No tiene monto pagado
            } else if (montoPagado === montoEsperado) {
                return COLORS.success // Verde - Igual
            } else if (montoPagado > montoEsperado) {
                return "#8B5CF6" // Morado - Pagado mayor al esperado
            } else {
                return "#F97316" // Naranja - Pagado menor al esperado
            }
        }

        return (
            <View style={{ marginVertical: 16 }}>
                <Text
                    style={{
                        ...FONTS.h4,
                        color: COLORS.black,
                        fontWeight: "600",
                        marginBottom: 12
                    }}
                >
                    Créditos del {dia} ({creditosDelDia.length})
                </Text>
                {creditosDelDia.map((credito, index) => (
                    <View
                        key={`credito-${index}`}
                        style={{
                            backgroundColor: COLORS.white,
                            borderRadius: 12,
                            padding: 16,
                            marginBottom: 12,
                            shadowColor: "#000",
                            shadowOffset: { width: 0, height: 2 },
                            shadowOpacity: 0.1,
                            shadowRadius: 4,
                            elevation: 3,
                            borderLeftWidth: 4,
                            borderLeftColor: obtenerColorBorde(credito)
                        }}
                    >
                        {/* Fila 1: Nombre del cliente (2 columnas) */}
                        <View style={{ marginBottom: 12 }}>
                            <Text
                                style={{
                                    ...FONTS.body3,
                                    color: COLORS.black,
                                    fontWeight: "600"
                                }}
                                numberOfLines={2}
                            >
                                {credito.nombre_cliente || credito.cdgns}
                            </Text>
                        </View>

                        {/* Fila 2: Crédito/Ciclo | Estado/Fecha */}
                        <View
                            style={{
                                flexDirection: "row",
                                justifyContent: "space-between",
                                marginBottom: 12
                            }}
                        >
                            {/* Columna 1: Crédito y Ciclo */}
                            <View style={{ flex: 1 }}>
                                <Text
                                    style={{ ...FONTS.body4, color: COLORS.gray3, marginBottom: 2 }}
                                >
                                    Crédito: {credito.cdgns}
                                </Text>
                                <Text style={{ ...FONTS.body4, color: COLORS.gray3 }}>
                                    Ciclo: {credito.ciclo}
                                </Text>
                            </View>

                            {/* Columna 2: Estado y Fecha */}
                            <View style={{ alignItems: "flex-end", justifyContent: "center" }}>
                                <View
                                    style={{
                                        backgroundColor:
                                            credito.estatus_pago === "PENDIENTE"
                                                ? COLORS.warning
                                                : COLORS.success,
                                        paddingHorizontal: 8,
                                        paddingVertical: 2,
                                        borderRadius: 8,
                                        marginBottom: 4
                                    }}
                                >
                                    <Text
                                        style={{
                                            ...FONTS.body5,
                                            color: COLORS.white,
                                            fontWeight: "600"
                                        }}
                                    >
                                        {credito.estatus_pago}
                                    </Text>
                                </View>
                                <Text style={{ ...FONTS.body4, color: COLORS.gray3 }}>
                                    {credito.fecha_esperada}
                                </Text>
                            </View>
                        </View>

                        {/* Fila 3: Monto Esperado | Monto Pagado */}
                        <View
                            style={{
                                flexDirection: "row",
                                justifyContent: "space-between",
                                alignItems: "flex-end"
                            }}
                        >
                            {/* Columna 1: Monto Esperado */}
                            <View style={{ flex: 1 }}>
                                <Text style={{ ...FONTS.body4, color: COLORS.gray3 }}>
                                    Monto Esperado
                                </Text>
                                <Text
                                    style={{
                                        ...FONTS.body3,
                                        color: COLORS.primary,
                                        fontWeight: "600"
                                    }}
                                >
                                    ${numeral(credito.monto_esperado).format("0,0.00")}
                                </Text>
                            </View>

                            {/* Columna 2: Monto Pagado (solo si > 0) */}
                            {credito.monto_pagado > 0 && (
                                <View style={{ alignItems: "flex-end" }}>
                                    <Text style={{ ...FONTS.body4, color: COLORS.gray3 }}>
                                        Monto Pagado
                                    </Text>
                                    <Text
                                        style={{
                                            ...FONTS.body3,
                                            color: COLORS.success,
                                            fontWeight: "600"
                                        }}
                                    >
                                        ${numeral(credito.monto_pagado).format("0,0.00")}
                                    </Text>
                                </View>
                            )}
                        </View>
                    </View>
                ))}
            </View>
        )
    }

    if (loading) {
        return (
            <View
                style={{
                    flex: 1,
                    backgroundColor: COLORS.grayscale100,
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
                    Cargando detalles...
                </Text>
            </View>
        )
    }

    if (!datosEjecutivo) {
        return (
            <View
                style={{
                    flex: 1,
                    backgroundColor: COLORS.grayscale100,
                    justifyContent: "center",
                    alignItems: "center"
                }}
            >
                <StatusBar backgroundColor={COLORS.white} barStyle="dark-content" />
                <MaterialIcons name="error-outline" size={64} color={COLORS.error} />
                <Text
                    style={{
                        ...FONTS.h3,
                        color: COLORS.black,
                        marginTop: 16,
                        marginBottom: 8
                    }}
                >
                    Error al cargar
                </Text>
                <Text
                    style={{
                        ...FONTS.body3,
                        color: COLORS.gray3,
                        textAlign: "center",
                        marginHorizontal: 40
                    }}
                >
                    No se pudieron cargar los datos del ejecutivo
                </Text>
                <Pressable
                    onPress={volverAlResumen}
                    style={{
                        backgroundColor: COLORS.primary,
                        paddingHorizontal: 24,
                        paddingVertical: 12,
                        borderRadius: 8,
                        marginTop: 24
                    }}
                >
                    <Text style={{ ...FONTS.body3, color: COLORS.white }}>Volver</Text>
                </Pressable>
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
                <Pressable onPress={volverAlResumen} className="mr-4">
                    <Feather name="arrow-left" size={24} color="white" />
                </Pressable>
                <Text className="flex-1 text-white text-lg font-semibold">
                    Detalle del Ejecutivo
                </Text>
            </View>
            <View className="bg-white flex-1 rounded-t-3xl">
                <View className="p-4 border-b border-gray-200">
                    <View className="flex-row justify-between items-start">
                        <View className="flex-1">
                            <Text className="text-2xl font-bold text-gray-800">
                                {datosEjecutivo.NOMBRE_ASESOR}
                            </Text>
                            <Text className="text-base text-gray-600">
                                <Text className="text-gray-600 text-sm">
                                    {dia} - {datosEjecutivo.SUCURSAL} - {getDisplayDate(fecha)}
                                </Text>
                            </Text>
                        </View>
                    </View>
                </View>
                <ScrollView
                    className="p-6"
                    showsVerticalScrollIndicator={false}
                    style={{ flex: 1 }}
                    contentContainerStyle={{ paddingBottom: 100 }}
                >
                    <View className="flex-row flex-wrap justify-between mb-4">
                        {renderInfoCard(
                            "Código del Ejecutivo",
                            datosEjecutivo.ASESOR,
                            "person",
                            COLORS.info
                        )}

                        {renderInfoCard(
                            "Efectivo Recolectado",
                            `$${numeral(datosEjecutivo.RECOLECTADO).format("0,0.00")}`,
                            "attach-money",
                            COLORS.success
                        )}

                        {renderInfoCard(
                            "Por Recolectar",
                            `$${numeral(datosEjecutivo.POR_RECOLECTAR_EFECTIVO).format("0,0.00")}`,
                            "schedule",
                            COLORS.warning
                        )}

                        {renderInfoCard(
                            "Pendiente de Efectivo",
                            `$${numeral(datosEjecutivo.PENDIENTE_EFECTIVO).format("0,0.00")}`,
                            "money-off",
                            datosEjecutivo.PENDIENTE_EFECTIVO >= 0 ? COLORS.primary : COLORS.error
                        )}
                    </View>
                    <View className="flex justify-between">
                        {renderEstadisticasCard()}

                        {/* Botón para ver ruta */}
                        <Pressable
                            onPress={verRutaEjecutivo}
                            style={{
                                backgroundColor: COLORS.primary,
                                marginVertical: 20,
                                paddingVertical: 16,
                                borderRadius: 12,
                                flexDirection: "row",
                                alignItems: "center",
                                justifyContent: "center",
                                shadowColor: "#000",
                                shadowOffset: { width: 0, height: 2 },
                                shadowOpacity: 0.2,
                                shadowRadius: 4,
                                elevation: 5
                            }}
                        >
                            <Feather
                                name="map-pin"
                                size={24}
                                color={COLORS.white}
                                style={{ marginRight: 12 }}
                            />
                            <Text
                                style={{
                                    ...FONTS.h4,
                                    color: COLORS.white,
                                    fontWeight: "600"
                                }}
                            >
                                Ver Ruta de Cobranza
                            </Text>
                        </Pressable>

                        {/* Créditos del día */}
                        {renderCreditosDelDia()}
                    </View>
                </ScrollView>
            </View>
        </View>
    )
}

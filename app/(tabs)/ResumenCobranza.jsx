import { useState, useEffect, useContext } from "react"
import {
    View,
    Text,
    StatusBar,
    ScrollView,
    Pressable,
    ActivityIndicator,
    Dimensions,
    Platform,
    Image,
    TextInput
} from "react-native"
import { SafeAreaInsetsContext } from "react-native-safe-area-context"
import { MaterialIcons, Feather } from "@expo/vector-icons"
import { router } from "expo-router"
import { PieChart } from "react-native-chart-kit"

import { COLORS, FONTS, images } from "../../constants"
import { useSession } from "../../context/SessionContext"
import { resumenCobranza } from "../../services"
import numeral from "numeral"

const screenWidth = Dimensions.get("window").width

export default function ResumenCobranza() {
    const { usuario } = useSession()
    const [datos, setDatos] = useState(null)
    const [loading, setLoading] = useState(true)
    const [expandedDay, setExpandedDay] = useState(null)
    const [terminoBusqueda, setTerminoBusqueda] = useState("")
    const insets = useContext(SafeAreaInsetsContext)

    const [mostrarBusqueda, setMostrarBusqueda] = useState(false)
    const actualizarClientes = async () => {
        await obtenerDatos()
    }

    const diasSemana = ["LUNES", "MARTES", "MIERCOLES", "JUEVES", "VIERNES"]
    const coloresDias = {
        LUNES: "#FF6B6B",
        MARTES: "#4ECDC4",
        MIERCOLES: "#45B7D1",
        JUEVES: "#96CEB4",
        VIERNES: "#FFEAA7"
    }

    // Función para obtener todos los ejecutivos filtrados por búsqueda
    const obtenerEjecutivosFiltrados = () => {
        if (!datos || terminoBusqueda.length < 3) return []

        const ejecutivosFiltrados = []

        diasSemana.forEach((dia) => {
            const datosDelDia = datos?.por_dia[dia]
            if (datosDelDia && Object.keys(datosDelDia).length > 0) {
                const sucursalKey = Object.keys(datosDelDia)[0]
                const datosSucursal = datosDelDia[sucursalKey]

                datosSucursal.detalle.forEach((ejecutivo) => {
                    if (
                        ejecutivo.NOMBRE_ASESOR.toLowerCase().includes(
                            terminoBusqueda.toLowerCase()
                        ) ||
                        ejecutivo.ASESOR.toLowerCase().includes(terminoBusqueda.toLowerCase())
                    ) {
                        ejecutivosFiltrados.push({
                            ...ejecutivo,
                            dia: dia
                        })
                    }
                })
            }
        })

        return ejecutivosFiltrados
    }

    const clientesFiltrados = obtenerEjecutivosFiltrados()

    const obtenerColorDia = (dia) => {
        const hoy = new Date()
        const diaSemana = hoy.getDay() // 0 = domingo, 1 = lunes, etc.
        const diasSemanaMap = {
            1: "LUNES",
            2: "MARTES",
            3: "MIERCOLES",
            4: "JUEVES",
            5: "VIERNES"
        }

        const diaActual = diasSemanaMap[diaSemana]

        if (dia === diaActual) return COLORS.success // Verde para día actual

        const indiceDiaActual = diasSemana.indexOf(diaActual)
        const indiceDia = diasSemana.indexOf(dia)

        if (indiceDia < indiceDiaActual) return COLORS.error // Rojo para días anteriores
        if (indiceDia > indiceDiaActual) return COLORS.warning // Amarillo para días posteriores

        return COLORS.gray3
    }

    const obtenerDatos = async () => {
        try {
            setLoading(true)
            const response = await resumenCobranza.obtener()
            if (response.success) {
                setDatos(response.data)
            } else {
                console.error("Error al obtener resumen de cobranza:", response.error)
            }
        } catch (error) {
            console.error("Error inesperado:", error)
        } finally {
            setLoading(false)
        }
    }

    const toggleDay = (dia) => {
        setExpandedDay(expandedDay === dia ? null : dia)
    }

    const obtenerFechaDia = (dia) => {
        const hoy = new Date()
        const diasSemana = ["LUNES", "MARTES", "MIERCOLES", "JUEVES", "VIERNES"]
        const indiceDia = diasSemana.indexOf(dia)

        // Obtener el lunes de la semana actual
        const diaSemana = hoy.getDay() // 0 = domingo, 1 = lunes, etc.
        const diasHastaLunes = diaSemana === 0 ? -6 : 1 - diaSemana
        const lunesActual = new Date(hoy)
        lunesActual.setDate(hoy.getDate() + diasHastaLunes)

        // Calcular la fecha del día específico
        const fechaDia = new Date(lunesActual)
        fechaDia.setDate(lunesActual.getDate() + indiceDia)

        const year = fechaDia.getFullYear()
        const month = String(fechaDia.getMonth() + 1).padStart(2, "0")
        const day = String(fechaDia.getDate()).padStart(2, "0")

        return `${year}-${month}-${day}`
    }

    const verDetalleEjecutivo = (ejecutivo, dia) => {
        const fechaDia = obtenerFechaDia(dia)
        router.push({
            pathname: "/(screens)/DetalleEjecutivo",
            params: {
                ejecutivo: JSON.stringify(ejecutivo),
                dia: dia,
                fecha: fechaDia
            }
        })
    }

    const renderPieChart = (pagosEsperados, pagosCobrados, pagosPendientes) => {
        const porcentajeAvance = pagosEsperados > 0 ? (pagosCobrados / pagosEsperados) * 100 : 0
        const porcentajePendiente =
            pagosPendientes > 0 ? (pagosPendientes / pagosEsperados) * 100 : 0

        const data = [
            {
                name: "Cobrados",
                population: Math.max(numeral(porcentajeAvance).value(), 0),
                color: COLORS.success,
                legendFontColor: COLORS.black,
                legendFontSize: 12
            },
            {
                name: "Pendientes",
                population: Math.max(numeral(porcentajePendiente).value(), 0),
                color: COLORS.error,
                legendFontColor: COLORS.black,
                legendFontSize: 12
            }
        ]

        return (
            <View style={{ alignItems: "center", marginVertical: 15 }}>
                <PieChart
                    data={data}
                    width={screenWidth - 60}
                    height={200}
                    chartConfig={{
                        backgroundColor: COLORS.white,
                        backgroundGradientFrom: COLORS.white,
                        backgroundGradientTo: COLORS.white,
                        color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`
                    }}
                    accessor={"population"}
                    backgroundColor={"transparent"}
                    paddingLeft={"15"}
                    absolute
                />
                <Text
                    style={{
                        ...FONTS.h3,
                        color: COLORS.black,
                        marginTop: 10
                    }}
                >
                    {porcentajeAvance.toFixed(1)}% completado
                </Text>
            </View>
        )
    }

    const renderDia = (dia) => {
        const datosDelDia = datos?.por_dia[dia]
        if (!datosDelDia || Object.keys(datosDelDia).length === 0) {
            return (
                <View
                    key={dia}
                    style={{
                        backgroundColor: COLORS.white,
                        marginHorizontal: 20,
                        marginVertical: 8,
                        borderRadius: 12,
                        padding: 16,
                        shadowColor: "#000",
                        shadowOffset: { width: 0, height: 2 },
                        shadowOpacity: 0.1,
                        shadowRadius: 4,
                        elevation: 3
                    }}
                >
                    <View
                        style={{
                            flexDirection: "row",
                            alignItems: "center",
                            justifyContent: "space-between"
                        }}
                    >
                        <View style={{ flexDirection: "row", alignItems: "center" }}>
                            <View
                                style={{
                                    width: 12,
                                    height: 12,
                                    borderRadius: 6,
                                    backgroundColor: obtenerColorDia(dia),
                                    marginRight: 12
                                }}
                            />
                            <Text style={{ ...FONTS.h3, color: COLORS.black }}>{dia}</Text>
                        </View>
                        <Text style={{ ...FONTS.body3, color: COLORS.gray3 }}>Sin datos</Text>
                    </View>
                </View>
            )
        }

        const sucursalKey = Object.keys(datosDelDia)[0]
        const datosSucursal = datosDelDia[sucursalKey]
        const isExpanded = expandedDay === dia

        const totalEsperados =
            datosSucursal.global.PAGOS_COBRADOS + datosSucursal.global.PAGOS_PENDIENTES
        const totalCobrados = datosSucursal.global.PAGOS_COBRADOS
        const totalPendientes = datosSucursal.global.PAGOS_PENDIENTES

        return (
            <View
                key={dia}
                style={{
                    backgroundColor: COLORS.white,
                    marginHorizontal: 20,
                    marginVertical: 8,
                    borderRadius: 12,
                    padding: 16,
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.1,
                    shadowRadius: 4,
                    elevation: 3
                }}
            >
                <Pressable
                    onPress={() => toggleDay(dia)}
                    style={{
                        flexDirection: "row",
                        alignItems: "center",
                        justifyContent: "space-between"
                    }}
                >
                    <View style={{ flexDirection: "row", alignItems: "center", flex: 1 }}>
                        <View
                            style={{
                                width: 12,
                                height: 12,
                                borderRadius: 6,
                                backgroundColor: obtenerColorDia(dia),
                                marginRight: 12
                            }}
                        />
                        <View style={{ flex: 1 }}>
                            <Text style={{ ...FONTS.h3, color: COLORS.black }}>{dia}</Text>
                            <Text style={{ ...FONTS.body4, color: COLORS.gray3 }}>
                                Esperados: {totalEsperados} | Cobrados: {totalCobrados} |
                                Pendientes: {totalPendientes}
                            </Text>
                        </View>
                    </View>
                    <MaterialIcons
                        name={isExpanded ? "expand-less" : "expand-more"}
                        size={24}
                        color={COLORS.gray3}
                    />
                </Pressable>

                {isExpanded && (
                    <View style={{ marginTop: 20 }}>
                        {renderPieChart(totalEsperados, totalCobrados, totalPendientes)}

                        <Text
                            style={{
                                ...FONTS.h4,
                                color: COLORS.black,
                                marginBottom: 12,
                                marginTop: 10
                            }}
                        >
                            Ejecutivos
                        </Text>

                        {datosSucursal.detalle.map((ejecutivo, index) => (
                            <Pressable
                                key={index}
                                onPress={() => verDetalleEjecutivo(ejecutivo, dia)}
                                style={{
                                    flexDirection: "row",
                                    alignItems: "center",
                                    justifyContent: "space-between",
                                    paddingVertical: 12,
                                    paddingHorizontal: 16,
                                    backgroundColor: COLORS.grayscale100,
                                    borderRadius: 8,
                                    marginVertical: 4
                                }}
                            >
                                <View style={{ flex: 1 }}>
                                    <Text
                                        style={{
                                            ...FONTS.body3,
                                            color: COLORS.black,
                                            fontWeight: "600"
                                        }}
                                    >
                                        {ejecutivo.NOMBRE_ASESOR}
                                    </Text>
                                    <Text
                                        style={{
                                            ...FONTS.body4,
                                            color: COLORS.gray3
                                        }}
                                    >
                                        Pagos: {ejecutivo.PAGOS_COBRADOS}/{ejecutivo.PAGOS_DEL_DIA}{" "}
                                        | Recolectado: $
                                        {numeral(ejecutivo.RECOLECTADO).format("0,0.00")}
                                    </Text>
                                </View>
                                <Feather name="eye" size={20} color={COLORS.primary} />
                            </Pressable>
                        ))}
                    </View>
                )}
            </View>
        )
    }

    const renderResultadosBusqueda = () => {
        if (terminoBusqueda.length < 3) return null

        return (
            <View style={{ paddingHorizontal: 20, paddingVertical: 16 }}>
                <Text
                    style={{
                        ...FONTS.h4,
                        color: COLORS.black,
                        marginBottom: 12
                    }}
                >
                    Resultados de Búsqueda ({clientesFiltrados.length})
                </Text>

                {clientesFiltrados.length === 0 ? (
                    <View
                        style={{
                            backgroundColor: COLORS.white,
                            borderRadius: 12,
                            padding: 20,
                            alignItems: "center",
                            shadowColor: "#000",
                            shadowOffset: { width: 0, height: 2 },
                            shadowOpacity: 0.1,
                            shadowRadius: 4,
                            elevation: 3
                        }}
                    >
                        <MaterialIcons name="search-off" size={48} color={COLORS.gray3} />
                        <Text
                            style={{
                                ...FONTS.body3,
                                color: COLORS.black,
                                marginTop: 12,
                                marginBottom: 4
                            }}
                        >
                            Sin resultados
                        </Text>
                        <Text
                            style={{
                                ...FONTS.body4,
                                color: COLORS.gray3,
                                textAlign: "center"
                            }}
                        >
                            No se encontraron ejecutivos que coincidan con "{terminoBusqueda}"
                        </Text>
                    </View>
                ) : (
                    clientesFiltrados.map((ejecutivo, index) => (
                        <Pressable
                            key={`busqueda-${index}`}
                            onPress={() => verDetalleEjecutivo(ejecutivo, ejecutivo.dia)}
                            style={{
                                flexDirection: "row",
                                alignItems: "center",
                                justifyContent: "space-between",
                                paddingVertical: 16,
                                paddingHorizontal: 20,
                                backgroundColor: COLORS.white,
                                borderRadius: 12,
                                marginVertical: 4,
                                shadowColor: "#000",
                                shadowOffset: { width: 0, height: 2 },
                                shadowOpacity: 0.1,
                                shadowRadius: 4,
                                elevation: 3
                            }}
                        >
                            <View style={{ flex: 1 }}>
                                <Text
                                    style={{
                                        ...FONTS.body3,
                                        color: COLORS.black,
                                        fontWeight: "600"
                                    }}
                                >
                                    {ejecutivo.NOMBRE_ASESOR}
                                </Text>
                                <Text
                                    style={{
                                        ...FONTS.body4,
                                        color: COLORS.gray3
                                    }}
                                >
                                    {ejecutivo.dia} | Código: {ejecutivo.ASESOR}
                                </Text>
                                <Text
                                    style={{
                                        ...FONTS.body4,
                                        color: COLORS.gray3
                                    }}
                                >
                                    Pagos: {ejecutivo.PAGOS_COBRADOS}/{ejecutivo.PAGOS_DEL_DIA} |
                                    Recolectado: ${numeral(ejecutivo.RECOLECTADO).format("0,0.00")}
                                </Text>
                            </View>
                            <View style={{ alignItems: "center" }}>
                                <Feather name="eye" size={20} color={COLORS.primary} />
                                <Text
                                    style={{
                                        ...FONTS.body5,
                                        color: COLORS.primary,
                                        marginTop: 2
                                    }}
                                >
                                    Ver
                                </Text>
                            </View>
                        </Pressable>
                    ))
                )}
            </View>
        )
    }

    useEffect(() => {
        obtenerDatos()
    }, [])

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
                    Cargando resumen...
                </Text>
            </View>
        )
    }

    return (
        <View
            className="flex-1 bg-primary"
            style={{
                paddingTop: insets.top,
                paddingBottom: Platform.OS === "ios" ? 90 : 60
            }}
        >
            <StatusBar barStyle="light-content" />
            <View className="flex-row items-center p-4">
                <Image
                    source={images.avatar}
                    className="w-10 h-10 rounded-full border border-white"
                />
                <Text className="flex-1 ml-2.5 text-white">HOLA, {usuario?.nombre}</Text>
            </View>

            <View className="bg-white flex-1 rounded-t-3xl">
                <View className="flex-row justify-between items-center border-b border-gray-200 px-3">
                    <Text className="text-lg font-semibold my-5">Resumen de Cobranza</Text>

                    <View className="flex-row items-center">
                        <Pressable
                            onPress={() => setMostrarBusqueda(!mostrarBusqueda)}
                            className="mr-3 p-2"
                        >
                            <MaterialIcons
                                name="search"
                                size={24}
                                color={mostrarBusqueda ? COLORS.primary : "black"}
                            />
                        </Pressable>

                        <Pressable onPress={actualizarClientes} disabled={loading}>
                            {loading ? (
                                <ActivityIndicator color="black" size="small" />
                            ) : (
                                <MaterialIcons name="refresh" size={24} color="black" />
                            )}
                        </Pressable>
                    </View>
                </View>

                {/* Campo de búsqueda */}
                {mostrarBusqueda && (
                    <View className="px-3 py-3 border-b border-gray-100">
                        <View className="flex-row items-center bg-gray-50 rounded-xl px-4 py-3">
                            <MaterialIcons name="search" size={20} color="#6B7280" />
                            <TextInput
                                value={terminoBusqueda}
                                onChangeText={setTerminoBusqueda}
                                placeholder="Buscar por nombre o número de crédito..."
                                className="flex-1 ml-2 text-base"
                                autoFocus={true}
                            />
                            {terminoBusqueda.length > 0 && (
                                <Pressable onPress={() => setTerminoBusqueda("")}>
                                    <MaterialIcons name="clear" size={20} color="#6B7280" />
                                </Pressable>
                            )}
                        </View>
                        {terminoBusqueda.length > 0 && terminoBusqueda.length < 3 && (
                            <Text className="text-xs text-gray-500 mt-2">
                                Ingrese al menos 3 caracteres para buscar
                            </Text>
                        )}
                        {terminoBusqueda.length >= 3 && (
                            <Text className="text-xs text-gray-600 mt-2">
                                {clientesFiltrados.length} resultado(s) encontrado(s)
                            </Text>
                        )}
                    </View>
                )}

                {datos?.resumen_semanal_total && (
                    <View className="border-b border-gray-200 px-5 py-3 flex-col justify-center w-full">
                        <View className="flex-row justify-between items-center">
                            <Text>Total Semanal:</Text>
                            <Text>
                                {new Date().toLocaleString("es-MX", {
                                    timeZone: "America/Mexico_City",
                                    year: "numeric",
                                    month: "2-digit",
                                    day: "2-digit",
                                    hour: "2-digit",
                                    minute: "2-digit",
                                    second: "2-digit"
                                })}
                            </Text>
                        </View>
                        <Text>
                            Esperados:{" "}
                            {(datos?.resumen_semanal_total?.PAGOS_COBRADOS || 0) +
                                (datos?.resumen_semanal_total?.PAGOS_PENDIENTES || 0)}
                        </Text>
                        <Text>Cobrados: {datos?.resumen_semanal_total?.PAGOS_COBRADOS || 0}</Text>
                    </View>
                )}

                <ScrollView
                    showsVerticalScrollIndicator={false}
                    style={{ flex: 1 }}
                    contentContainerStyle={{ paddingBottom: 100 }}
                >
                    {terminoBusqueda.length >= 3
                        ? renderResultadosBusqueda()
                        : diasSemana.map((dia) => renderDia(dia))}
                </ScrollView>
            </View>
        </View>
    )
}

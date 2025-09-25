import { useState } from "react"
import { View, Text, TextInput, ScrollView, Pressable, Image } from "react-native"
import { Feather } from "@expo/vector-icons"
import { router } from "expo-router"
import { useSession } from "../context/SessionContext"
import { COLORS, images } from "../constants"
import { sesion } from "../services"
import CustomAlert from "./CustomAlert"
import ContactSupport from "./ContactSupport"
import { useCustomAlert } from "../hooks/useCustomAlert"
import "../styles/global.css"

export default function Login() {
    const { login } = useSession()
    const { alertRef, showError } = useCustomAlert()
    const [usuario, setUsuario] = useState("")
    const [password, setPassword] = useState("")
    const [secureText, setSecureText] = useState(true)
    const [usuarioFocused, setUsuarioFocused] = useState(false)
    const [passwordFocused, setPasswordFocused] = useState(false)
    const [validando, setValidando] = useState(false)

    const validaLogin = async () => {
        if (!usuario.trim() || !password.trim())
            return showError(
                "Campos requeridos",
                "Por favor completa todos los campos para continuar."
            )

        setValidando(true)
        try {
            const response = await sesion.login(usuario, password)
            if (!response.success)
                return showError(
                    "Error de autenticación",
                    response.error || "Credenciales incorrectas. Verifica tu usuario y contraseña."
                )

            const userData = response.data
            const loginSuccess = await login(
                userData.access_token,
                userData.usuario,
                userData["key-maps"]
            )

            if (loginSuccess) router.replace("/(tabs)/ResumenCobranza")
            else
                showError(
                    "Error del sistema",
                    "Error al guardar la sesión. Por favor, inténtalo de nuevo."
                )
        } catch (error) {
            showError("Error inesperado", `Ocurrió un problema: ${error.message}`, [
                {
                    text: "Reintentar",
                    onPress: () => validaLogin(),
                    style: "default"
                },
                {
                    text: "Cancelar",
                    onPress: () => {},
                    style: "cancel"
                }
            ])
        } finally {
            setValidando(false)
        }
    }

    return (
        <View className="flex-1">
            <ScrollView
                contentContainerStyle={{
                    padding: 20,
                    flexGrow: 1,
                    justifyContent: "center"
                }}
                keyboardShouldPersistTaps="handled"
                className="flex-1"
            >
                <Image
                    source={images.logo}
                    className="h-36 self-center mb-8"
                    resizeMode="contain"
                />

                <View
                    className="flex-row items-center border rounded-3xl px-4 mb-4 h-12 w-4/5 self-center"
                    style={{
                        borderColor: usuarioFocused ? COLORS.info : "#ccc"
                    }}
                >
                    <Feather name="user" size={20} color={COLORS.neutralBlack} className="mr-2" />
                    <TextInput
                        className="flex-1 text-sm"
                        style={{ color: COLORS.shadesBlack, fontFamily: "regular" }}
                        placeholder="Usuario"
                        autoCapitalize="characters"
                        value={usuario}
                        onChangeText={setUsuario}
                        onFocus={() => setUsuarioFocused(true)}
                        onBlur={() => setUsuarioFocused(false)}
                    />
                </View>

                <View
                    className="flex-row items-center border rounded-3xl px-4 mb-6 h-12 w-4/5 self-center"
                    style={{
                        borderColor: passwordFocused ? COLORS.info : "#ccc"
                    }}
                >
                    <Feather name="key" size={20} color={COLORS.neutralBlack} className="mr-2" />
                    <TextInput
                        className="flex-1 text-sm"
                        style={{ color: COLORS.shadesBlack, fontFamily: "regular" }}
                        placeholder="Contraseña"
                        secureTextEntry={secureText}
                        value={password}
                        onChangeText={setPassword}
                        onFocus={() => setPasswordFocused(true)}
                        onBlur={() => setPasswordFocused(false)}
                    />
                    <Pressable onPress={() => setSecureText(!secureText)} className="p-1">
                        <Feather
                            name={secureText ? "eye-off" : "eye"}
                            size={20}
                            color={COLORS.neutralBlack}
                        />
                    </Pressable>
                </View>

                <Pressable
                    onPress={validaLogin}
                    className="rounded-full h-12 w-4/5 self-center justify-center items-center mb-5"
                    style={{
                        backgroundColor: COLORS.primary,
                        opacity: validando ? 0.5 : 1
                    }}
                    disabled={validando}
                >
                    {validando ? (
                        <Feather name="loader" size={20} color="white" className="animate-spin" />
                    ) : (
                        <Text className="text-white font-medium">Ingresar</Text>
                    )}
                </Pressable>
                <CustomAlert ref={alertRef} />
            </ScrollView>

            <View className="p-4 pb-8">
                <Text
                    className="text-center text-sm font-bold mb-1"
                    style={{ color: COLORS.shadesBlack, fontFamily: "regular" }}
                >
                    ¿Tienes problemas?
                </Text>
                <Text
                    className="text-center text-sm mb-4"
                    style={{ color: COLORS.shadesBlack, fontFamily: "regular" }}
                >
                    Contacta a Soporte Operativo:
                </Text>
                <View className="flex-row justify-center px-4">
                    <ContactSupport />
                </View>
            </View>
        </View>
    )
}

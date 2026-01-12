import React, { useState } from "react";
import { Alert, Text, TouchableOpacity } from "react-native";
import { Button } from "../../components/Button";
import { Input } from "../../components/Input";
import { Screen } from "../../components/Screen";
import { SectionHeader } from "../../components/SectionHeader";
import { colors } from "../../theme/colors";
import { useAuthStore } from "../../state/useAuthStore";

export const LoginScreen = ({ navigation }) => {
  const { login, loading } = useAuthStore();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = async () => {
    try {
      await login({ email, password });
    } catch (error) {
      Alert.alert("Login failed", error.message);
    }
  };

  return (
    <Screen>
      <SectionHeader title="Welcome back" subtitle="Sign in to manage your league." />
      <Input label="Email" value={email} onChangeText={setEmail} placeholder="you@example.com" />
      <Input
        label="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        placeholder="••••••••"
      />
      <Button title={loading ? "Signing in..." : "Sign In"} onPress={handleLogin} disabled={loading} />
      <TouchableOpacity onPress={() => navigation.navigate("Register")}
        style={{ marginTop: 16 }}>
        <Text style={{ color: colors.textSecondary }}>
          New here? <Text style={{ color: colors.accent }}>Create an account</Text>
        </Text>
      </TouchableOpacity>
    </Screen>
  );
};

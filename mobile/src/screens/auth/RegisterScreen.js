import React, { useState } from "react";
import { Alert, Text, TouchableOpacity } from "react-native";
import { Button } from "../../components/Button";
import { Input } from "../../components/Input";
import { Screen } from "../../components/Screen";
import { SectionHeader } from "../../components/SectionHeader";
import { colors } from "../../theme/colors";
import { useAuthStore } from "../../state/useAuthStore";

export const RegisterScreen = ({ navigation }) => {
  const { register, loading } = useAuthStore();
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleRegister = async () => {
    try {
      await register({ displayName, email, password });
    } catch (error) {
      Alert.alert("Registration failed", error.message);
    }
  };

  return (
    <Screen>
      <SectionHeader title="Join the league" subtitle="Create an account to play and score." />
      <Input label="Display name" value={displayName} onChangeText={setDisplayName} placeholder="Alex Carter" />
      <Input label="Email" value={email} onChangeText={setEmail} placeholder="you@example.com" />
      <Input
        label="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        placeholder="••••••••"
      />
      <Button
        title={loading ? "Creating..." : "Create Account"}
        onPress={handleRegister}
        disabled={loading}
      />
      <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginTop: 16 }}>
        <Text style={{ color: colors.textSecondary }}>
          Already registered? <Text style={{ color: colors.accent }}>Sign in</Text>
        </Text>
      </TouchableOpacity>
    </Screen>
  );
};

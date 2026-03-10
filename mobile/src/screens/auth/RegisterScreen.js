import React, { useState } from "react";
import { Alert, Linking, Pressable, Text, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
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
  const [agreed, setAgreed] = useState(false);

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
      <Input label="Display name" value={displayName} onChangeText={setDisplayName} placeholder="Alex Carter" testID="input-register-name" />
      <Input label="Email" value={email} onChangeText={setEmail} placeholder="you@example.com" testID="input-register-email" />
      <Input
        label="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        placeholder="••••••••"
        testID="input-register-password"
      />
      <Pressable
        onPress={() => setAgreed(!agreed)}
        style={{ flexDirection: "row", alignItems: "flex-start", marginVertical: 12 }}
        testID="checkbox-agree"
      >
        <Ionicons
          name={agreed ? "checkbox" : "square-outline"}
          size={22}
          color={agreed ? colors.accent : colors.textMuted}
          style={{ marginRight: 8, marginTop: 1 }}
        />
        <View style={{ flex: 1 }}>
          <Text style={{ color: colors.textSecondary, fontSize: 13, lineHeight: 18 }}>
            I am at least 13 years old and agree to the{" "}
            <Text
              style={{ color: colors.accent, textDecorationLine: "underline" }}
              onPress={() => Linking.openURL("http://www.snookerpoolleague.co.uk/terms")}
            >
              Terms of Service
            </Text>
            {" "}and{" "}
            <Text
              style={{ color: colors.accent, textDecorationLine: "underline" }}
              onPress={() => Linking.openURL("http://www.snookerpoolleague.co.uk/privacy")}
            >
              Privacy Policy
            </Text>.
          </Text>
        </View>
      </Pressable>
      <Button
        title={loading ? "Creating..." : "Create Account"}
        onPress={handleRegister}
        disabled={loading || !agreed}
        testID="btn-register"
      />
      <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginTop: 16 }}>
        <Text style={{ color: colors.textSecondary }}>
          Already registered? <Text style={{ color: colors.accent }}>Sign in</Text>
        </Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => Linking.openURL("http://www.snookerpoolleague.co.uk/support")} style={{ marginTop: 12 }}>
        <Text style={{ color: colors.textMuted, fontSize: 13 }}>
          Need help? <Text style={{ color: colors.accent, textDecorationLine: "underline" }}>Contact Support</Text>
        </Text>
      </TouchableOpacity>
    </Screen>
  );
};

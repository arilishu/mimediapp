import React from "react";
import { View, StyleSheet, Image } from "react-native";

import { ThemedText } from "@/components/ThemedText";
<<<<<<< HEAD
import { Spacing, Typography } from "@/constants/theme";
=======
import { Spacing } from "@/constants/theme";
>>>>>>> 3a0bcec (Extracted stack files)

interface HeaderTitleProps {
  title: string;
}

export function HeaderTitle({ title }: HeaderTitleProps) {
  return (
    <View style={styles.container}>
      <Image
        source={require("../../assets/images/icon.png")}
        style={styles.icon}
        resizeMode="contain"
      />
      <ThemedText style={styles.title}>{title}</ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-start",
  },
  icon: {
    width: 28,
    height: 28,
    marginRight: Spacing.sm,
<<<<<<< HEAD
    borderRadius: 6,
=======
>>>>>>> 3a0bcec (Extracted stack files)
  },
  title: {
    fontSize: 17,
    fontWeight: "600",
<<<<<<< HEAD
    fontFamily: Typography.h4.fontFamily,
=======
>>>>>>> 3a0bcec (Extracted stack files)
  },
});

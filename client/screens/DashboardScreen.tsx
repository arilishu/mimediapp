import React, { useState, useCallback } from "react";
import { View, FlatList, StyleSheet, RefreshControl } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import * as Haptics from "expo-haptics";

import { ThemedText } from "@/components/ThemedText";
import { ChildCard } from "@/components/ChildCard";
import { EmptyState } from "@/components/EmptyState";
import { FloatingActionButton } from "@/components/FloatingActionButton";
import { ShareModal } from "@/components/ShareModal";
import { useTheme } from "@/hooks/useTheme";
import { Spacing } from "@/constants/theme";
import { ChildStorage } from "@/lib/storage";
import type { Child } from "@/types";
import type { RootStackParamList } from "@/navigation/RootStackNavigator";

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function DashboardScreen() {
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const tabBarHeight = useBottomTabBarHeight();
  const { theme } = useTheme();
  const navigation = useNavigation<NavigationProp>();

  const [children, setChildren] = useState<Child[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [shareModalVisible, setShareModalVisible] = useState(false);
  const [selectedChild, setSelectedChild] = useState<Child | null>(null);

  const loadChildren = useCallback(async () => {
    try {
      const data = await ChildStorage.getAll();
      setChildren(data);
    } catch (error) {
      console.error("Error loading children:", error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadChildren();
    }, [loadChildren])
  );

  const handleRefresh = () => {
    setIsRefreshing(true);
    loadChildren();
  };

  const handleAddChild = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    navigation.navigate("AddChild");
  };

  const handleChildPress = (child: Child) => {
    navigation.navigate("ChildProfile", { childId: child.id });
  };

  const handleShareChild = (child: Child) => {
    setSelectedChild(child);
    setShareModalVisible(true);
  };

  const renderItem = ({ item, index }: { item: Child; index: number }) => (
    <View style={[styles.cardWrapper, index % 2 === 0 ? styles.cardLeft : styles.cardRight]}>
      <ChildCard
        child={item}
        onPress={() => handleChildPress(item)}
        onShare={() => handleShareChild(item)}
      />
    </View>
  );

  const renderEmpty = () => (
    <EmptyState
      image={require("../../assets/images/illustrations/empty_children_teddy_bear.png")}
      title="Agrega tu primer niño"
      subtitle="Comienza a registrar la informacion medica de tus hijos"
      buttonText="Agregar Niño"
      onButtonPress={handleAddChild}
    />
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.backgroundRoot }]}>
      <FlatList
        data={children}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        numColumns={2}
        contentContainerStyle={[
          styles.listContent,
          {
            paddingTop: headerHeight + Spacing.xl,
            paddingBottom: tabBarHeight + Spacing["5xl"],
          },
          children.length === 0 && styles.emptyContainer,
        ]}
        columnWrapperStyle={children.length > 0 ? styles.row : undefined}
        scrollIndicatorInsets={{ bottom: insets.bottom }}
        ListEmptyComponent={!isLoading ? renderEmpty : null}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor={theme.primary}
          />
        }
      />
      {children.length > 0 ? (
        <FloatingActionButton
          onPress={handleAddChild}
          style={{
            bottom: tabBarHeight + Spacing.xl,
            right: Spacing.xl,
          }}
        />
      ) : null}
      {selectedChild ? (
        <ShareModal
          visible={shareModalVisible}
          onClose={() => {
            setShareModalVisible(false);
            setSelectedChild(null);
          }}
          child={selectedChild}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: Spacing.lg,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
  },
  row: {
    justifyContent: "space-between",
    marginBottom: Spacing.lg,
  },
  cardWrapper: {
    flex: 1,
    maxWidth: "48%",
  },
  cardLeft: {
    marginRight: Spacing.sm,
  },
  cardRight: {
    marginLeft: Spacing.sm,
  },
});

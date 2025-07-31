import { Stack } from 'expo-router';

export default function AdminLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="vehicles" />
      <Stack.Screen name="create-mission" />
      <Stack.Screen name="all-missions" />
      <Stack.Screen name="users" />
      <Stack.Screen name="map-test" />
    </Stack>
  );
}

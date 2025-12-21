import { View, Text, TouchableOpacity, Platform } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
// LEGACY IMPORT (Keep this)
import * as FileSystem from "expo-file-system/legacy"; 
import * as Sharing from "expo-sharing";
import * as DocumentPicker from "expo-document-picker";
import { CloudDownload, CloudUpload, ArrowLeft, ShieldCheck, AlertTriangle } from "lucide-react-native";
import { useColorScheme } from "nativewind";
import { useThemeAlert } from "@/context/ThemeAlertContext";

export default function BackupScreen() {
  const router = useRouter();
  const { showAlert } = useThemeAlert();
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";

  // --- HELPER: FIND THE DATABASE ---
  const findDatabaseFile = async () => {
    try {
        // 1. Define the folder where Expo keeps databases
        const sqliteFolder = `${FileSystem.documentDirectory}SQLite`;
        
        // 2. Check if the folder exists
        const folderInfo = await FileSystem.getInfoAsync(sqliteFolder);
        if (!folderInfo.exists) {
            console.log("SQLite folder missing at:", sqliteFolder);
            return null;
        }

        // 3. Read the folder contents
        const files = await FileSystem.readDirectoryAsync(sqliteFolder);
        console.log("Files found in SQLite folder:", files);

        // 4. Look for our file (med_manager.db)
        const foundFile = files.find(f => f === "med_manager.db" || f.endsWith(".db"));

        if (foundFile) {
            return `${sqliteFolder}/${foundFile}`;
        }
        return null;

    } catch (e) {
        console.error("Error finding DB:", e);
        return null;
    }
  };

  // --- EXPORT FUNCTION ---
  const handleBackup = async () => {
    try {
      const dbUri = await findDatabaseFile();

      if (!dbUri) {
        showAlert({ title: "Error", message: "Database file not found! Have you added any medicines yet?", variant: "danger" });
        return;
      }

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(dbUri, {
          dialogTitle: "Backup Medication Data",
          mimeType: "application/x-sqlite3",
          UTI: "public.database", 
        });
      } else {
        showAlert({ title: "Error", message: "Sharing is not available on this device.", variant: "danger" });
      }
    } catch (e) {
      console.error(e);
      showAlert({ title: "Backup Failed", message: "Could not export data.", variant: "danger" });
    }
  };

  // --- IMPORT FUNCTION ---
  const handleRestore = async () => {
    showAlert({
        title: "Overwrite Data?",
        message: "This will DELETE all current data and replace it with the backup. This cannot be undone.",
        variant: "danger",
        buttons: [
            { text: "Cancel", style: "cancel" },
            { 
                text: "Yes, Restore", 
                style: "destructive",
                onPress: performRestore
            }
        ]
    });
  };

  const performRestore = async () => {
    try {
        const dbUri = await findDatabaseFile(); // Find where to put it
        // If DB doesn't exist yet, we can default to the standard path
        const targetUri = dbUri || `${FileSystem.documentDirectory}SQLite/med_manager.db`;

        const result = await DocumentPicker.getDocumentAsync({
            copyToCacheDirectory: true,
            type: "*/*" 
        });

        if (result.canceled) return;

        const sourceUri = result.assets[0].uri;
        const fileName = result.assets[0].name;

        if (!fileName.endsWith(".db") && !fileName.includes("med_manager")) {
             showAlert({ title: "Invalid File", message: "Please select a valid backup file (usually ends in .db)", variant: "warning" });
             return;
        }

        // Ensure SQLite folder exists before copying (if restoring on a fresh install)
        const sqliteFolder = `${FileSystem.documentDirectory}SQLite`;
        const folderInfo = await FileSystem.getInfoAsync(sqliteFolder);
        if (!folderInfo.exists) {
            await FileSystem.makeDirectoryAsync(sqliteFolder);
        }

        // Delete old and Copy new
        // We use { idempotent: true } so it doesn't crash if file is missing
        await FileSystem.deleteAsync(targetUri, { idempotent: true }); 
        await FileSystem.copyAsync({ from: sourceUri, to: targetUri });

        showAlert({ 
            title: "Success!", 
            message: "Data restored. Please restart the app to see changes.", 
            variant: "success",
            buttons: [{ text: "Restart Now", onPress: () => {
                router.dismissAll();
                router.replace("/(tabs)");
            }}] 
        });

    } catch (e) {
        console.error("Restore Error:", e);
        showAlert({ title: "Restore Failed", message: "Could not replace database file.", variant: "danger" });
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50 dark:bg-gray-900 px-5 pt-4">
      {/* HEADER */}
      <View className="flex-row items-center mb-8">
        <TouchableOpacity onPress={() => router.back()} className="mr-4 bg-white dark:bg-gray-800 p-2 rounded-full border border-gray-200 dark:border-gray-700">
            <ArrowLeft size={24} color={isDark ? "white" : "black"} />
        </TouchableOpacity>
        <Text className="text-2xl font-bold text-gray-900 dark:text-white">Data Backup</Text>
      </View>

      <View className="flex-1 justify-center items-center">
        <ShieldCheck size={80} color={isDark ? "#60A5FA" : "#2563EB"} className="mb-6 opacity-80" />
        <Text className="text-center text-gray-500 dark:text-gray-400 mb-10 px-6">
            Keep your data safe. Export a backup file to save on Google Drive or iCloud. You can restore it later if you switch phones.
        </Text>

        {/* BACKUP BUTTON */}
        <TouchableOpacity 
            onPress={handleBackup}
            className="w-full bg-blue-600 p-5 rounded-2xl flex-row items-center justify-center mb-4 shadow-md active:opacity-90"
        >
            <CloudUpload size={24} color="white" className="mr-3" />
            <View>
                <Text className="text-white font-bold text-lg">Backup Data</Text>
                <Text className="text-blue-100 text-xs">Save current records</Text>
            </View>
        </TouchableOpacity>

        {/* RESTORE BUTTON */}
        <TouchableOpacity 
            onPress={handleRestore}
            className="w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-5 rounded-2xl flex-row items-center justify-center shadow-sm active:bg-gray-100 dark:active:bg-gray-700"
        >
            <CloudDownload size={24} color={isDark ? "#EF4444" : "#DC2626"} className="mr-3" />
             <View>
                <Text className="text-red-600 dark:text-red-500 font-bold text-lg">Restore Backup</Text>
                <Text className="text-gray-400 text-xs">Overwrite current data</Text>
            </View>
        </TouchableOpacity>

        <View className="mt-8 flex-row items-center bg-amber-50 dark:bg-amber-900/20 p-4 rounded-xl border border-amber-100 dark:border-amber-800">
             <AlertTriangle size={20} color="#D97706" className="mr-3" />
             <Text className="text-amber-700 dark:text-amber-500 text-xs flex-1">
                Restoring a backup will verify the file type, but ensures you are selecting a valid "med_manager.db" file to avoid corruption.
             </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

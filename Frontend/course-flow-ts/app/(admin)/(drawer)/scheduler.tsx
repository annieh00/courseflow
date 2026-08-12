import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from "../../../components/ThemeContext";
import CustomDrawerContent from "../../../components/CustomDrawer";
import { useAuth } from '../../../auth/AuthContext';

export default function AdminScheduler() {
  const { theme } = useTheme();
  const styles = createStyles(theme);
  
  const { user } = useAuth();

  const roleLabel =
    user?.role === "advisor"
      ? "Advisor"
      : user?.role === "admin"
      ? "Admin"
      : "Student";
  return (
    <View style={styles.container}>
      <Text style={styles.header}>{roleLabel} Current Classes</Text>

      <View style={styles.classBox}>
        <Text style={styles.classTitle}>CPRE 308</Text>
        <Text style={styles.classSubtitle}>Operating Systems</Text>
        <Text style={styles.classTime}>MWF 8am - 9am</Text>
      </View>
    </View>
  );
}


const createStyles = (theme: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.background,
      padding: 20,
      alignItems: 'center',
    },
    header: {
      fontSize: 28,
      fontWeight: 'bold',
      color: theme.primary,
      marginBottom: 30,
      marginTop: 10,
    },
    classBox: {
      backgroundColor: theme.card,
      padding: 25,
      borderRadius: 12,
      width: '90%',
      maxWidth: 300,
      alignItems: 'center',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
      borderWidth: 2,
      borderColor: theme.primary + '50', // semi-transparent accent
      alignSelf: 'flex-start',
    },
    classTitle: {
      fontSize: 22,
      fontWeight: 'bold',
      color: theme.primary,
      marginBottom: 8,
    },
    classSubtitle: {
      fontSize: 18,
      color: theme.text,
      marginBottom: 8,
      textAlign: 'center',
    },
    classTime: {
      fontSize: 16,
      color: theme.textSecondary,
      fontWeight: '600',
    },
  });
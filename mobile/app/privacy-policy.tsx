import { View, Text, Pressable, ScrollView, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { colors } from '../src/theme/colors';
import { spacing } from '../src/theme/spacing';
import { typography } from '../src/theme/typography';

// In-app copy of docs/privacy-policy.md, kept in sync manually — see that
// file for the canonical version and edit history.
const SECTIONS = [
  {
    title: '1. Quelles données sont collectées',
    body:
      "Informations de compte (prénom, nom, téléphone, email optionnel, mot de passe jamais stocké en clair), " +
      "position GPS (carte, itinéraire, suivi pendant une course active uniquement), historique des courses, " +
      "photo de profil optionnelle, et pour les conducteurs : informations du véhicule et numéro/date d'expiration " +
      "du permis de conduire, nécessaires à la vérification avant de pouvoir recevoir des courses.",
  },
  {
    title: '2. Pourquoi ces données sont collectées',
    body:
      "Uniquement pour faire fonctionner le service : gérer ton compte, te mettre en relation avec un conducteur " +
      "ou un passager, calculer un itinéraire et un tarif, assurer le suivi d'une course en cours, vérifier les " +
      "conducteurs, et te permettre de consulter ton historique et de noter tes courses.",
  },
  {
    title: '3. Comment les données sont stockées',
    body:
      "Les données sont hébergées sur un serveur backend auto-géré (PostgreSQL), dans le cadre de ce projet " +
      "étudiant. Les mots de passe sont hachés (bcrypt) et jamais consultables en clair. Cette politique sera " +
      "mise à jour si le projet évolue vers un hébergement cloud plus large.",
  },
  {
    title: '4. Partage des données',
    body:
      "Aucune donnée n'est vendue ni partagée avec des tiers à des fins commerciales. Seules les informations " +
      "nécessaires au bon déroulement d'une course sont partagées entre le passager et le conducteur assignés. " +
      "Le calcul d'itinéraire utilise un service public tiers (OSRM) auquel seules les coordonnées de départ et " +
      "d'arrivée sont transmises, sans information d'identité.",
  },
  {
    title: '5. Droit de suppression du compte',
    body:
      "Tu peux demander la suppression de ton compte et de tes données. Cette fonctionnalité n'est pas encore " +
      "disponible directement dans l'application — contacte-nous à l'adresse ci-dessous en attendant, et ton " +
      "compte sera supprimé dans un délai raisonnable.",
  },
  {
    title: '6. Contact',
    body: 'Pour toute question ou demande de suppression de compte : contact@taxidja.td',
  },
];

export default function PrivacyPolicyScreen() {
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={8}>
          <Text style={styles.backText}>← Retour</Text>
        </Pressable>
        <Text style={styles.headerTitle}>Politique de confidentialité</Text>
      </View>

      <Text style={styles.updated}>Dernière mise à jour : 22 septembre 2026</Text>

      {SECTIONS.map((section) => (
        <View key={section.title} style={styles.section}>
          <Text style={styles.sectionTitle}>{section.title}</Text>
          <Text style={styles.sectionBody}>{section.body}</Text>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, paddingBottom: spacing.xxl, gap: spacing.lg },
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.lg, paddingTop: 40, paddingBottom: spacing.sm },
  backText: { ...typography.smallMedium, color: colors.primary },
  headerTitle: { ...typography.subtitle, color: colors.text, flexShrink: 1 },
  updated: { ...typography.small, color: colors.textSecondary },
  section: { gap: spacing.xs },
  sectionTitle: { ...typography.bodyMedium, color: colors.text },
  sectionBody: { ...typography.body, color: colors.textSecondary },
});

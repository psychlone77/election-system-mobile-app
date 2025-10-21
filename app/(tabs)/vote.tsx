import theme from "@/constants/theme";
import axiosInstance from "@/services/api";
import { getTokenSigned } from "@/services/getTokenSigned";
import { showErrorToast, showSuccessToast } from "@/utils/toast";
import { MaterialIcons } from "@expo/vector-icons";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

interface Candidate {
  id: string;
  name: string;
  party: string;
}

export default function VoteScreen() {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState("");

  // Fetch candidates from the server
  const fetchCandidates = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await axiosInstance.get("/candidates");
      setCandidates(response.data.data || response.data);
    } catch (error) {
      console.error("Failed to fetch candidates:", error);
      // Error is handled by axios interceptor, so we just set empty list
      setCandidates([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCandidates();
  }, [fetchCandidates]);

  const handleVote = (candidateId: string) => {
    setSelected(candidateId);
  };

  const submitVote = useCallback(async () => {
    if (!selected) {
      showErrorToast("Please select a candidate before submitting your vote.");
      return;
    }

    try {
      setIsSubmitting("Getting Token");
      const { signature, preparedMessage, rawHashHex } = await getTokenSigned();
      console.log("Response from getBlindToken:", { signature, preparedMessage, rawHashHex });
      console.log("Vote submitted for candidate:", selected);
      showSuccessToast("Your vote has been submitted successfully!");
    } catch (error) {
      console.error("Failed to submit vote:", error);
    } finally {
      setIsSubmitting("");
    }
  }, [selected]);

  if (isLoading) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.loadingText}>Loading candidates...</Text>
        </View>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      {/* Header Card */}
      <View style={styles.headerCard}>
        <View style={styles.headerIcon}>
          <MaterialIcons name="how-to-vote" size={40} color={theme.colors.primary} />
        </View>
        <Text style={styles.headerTitle}>Cast Your Vote</Text>
        <Text style={styles.headerSubtitle}>Select a candidate and submit your vote</Text>
      </View>

      {/* Candidates List */}
      {candidates.length > 0 ? (
        <View style={styles.candidatesContainer}>
          <Text style={styles.sectionTitle}>Available Candidates</Text>

          {candidates.map((candidate) => (
            <TouchableOpacity
              key={candidate.id}
              style={[
                styles.candidateCard,
                selected === candidate.id && styles.candidateCardSelected,
              ]}
              onPress={() => handleVote(candidate.id)}
              activeOpacity={0.7}
            >
              <View style={styles.candidateCheckbox}>
                {selected === candidate.id && (
                  <MaterialIcons name="check-circle" size={24} color={theme.colors.primary} />
                )}
                {selected !== candidate.id && <View style={styles.checkboxEmpty} />}
              </View>

              <View style={styles.candidateInfo}>
                <Text style={styles.candidateName}>{candidate.name}</Text>
                {candidate.party && <Text style={styles.candidateParty}>{candidate.party}</Text>}
                <Text style={styles.candidateInfoId} numberOfLines={2}>
                  {candidate.id}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      ) : (
        <View style={styles.noCandidatesContainer}>
          <MaterialIcons name="person-off" size={48} color="#999" />
          <Text style={styles.noCandidatesText}>No candidates available</Text>
        </View>
      )}

      {/* Submit Button */}
      <TouchableOpacity
        style={[styles.submitButton, !selected && styles.submitButtonDisabled]}
        onPress={submitVote}
        disabled={!selected || !!isSubmitting}
        activeOpacity={0.8}
      >
        {isSubmitting ? (
          <>
            <ActivityIndicator size="small" color="#FFF" />
            <Text style={styles.submitButtonText}>{isSubmitting}</Text>
          </>
        ) : (
          <>
            <MaterialIcons name="send" size={20} color="#FFF" />
            <Text style={styles.submitButtonText}>Submit Vote</Text>
          </>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
}

const { colors, spacing, radius, typography } = theme;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  contentContainer: {
    padding: spacing.lg,
    paddingBottom: spacing.lg * 2,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: spacing.md,
  },
  loadingText: {
    fontSize: typography.body,
    color: colors.purple900,
    marginTop: spacing.md,
  },
  headerCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    padding: spacing.lg,
    alignItems: "center",
    marginBottom: spacing.lg,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  headerIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.inputBg,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: spacing.md,
  },
  headerTitle: {
    fontSize: typography.h2,
    fontWeight: "700",
    color: colors.purple900,
    marginBottom: spacing.sm,
  },
  headerSubtitle: {
    fontSize: typography.body,
    color: "#666",
    textAlign: "center",
  },
  sectionTitle: {
    fontSize: typography.label,
    fontWeight: "700",
    color: colors.purple900,
    marginBottom: spacing.md,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  candidatesContainer: {
    marginBottom: spacing.lg,
  },
  candidateCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    padding: spacing.lg,
    marginBottom: spacing.md,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.md,
    borderWidth: 2,
    borderColor: "transparent",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  candidateCardSelected: {
    borderColor: colors.primary,
    backgroundColor: "#F9F7FF",
    shadowOpacity: 0.15,
    elevation: 4,
  },
  candidateCheckbox: {
    width: 28,
    height: 28,
    justifyContent: "center",
    alignItems: "center",
    marginTop: spacing.xs,
  },
  checkboxEmpty: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.neutralMuted,
  },
  candidateInfo: {
    flex: 1,
  },
  candidateName: {
    fontSize: typography.body,
    fontWeight: "700",
    color: colors.purple900,
    marginBottom: spacing.xs,
  },
  candidateParty: {
    fontSize: typography.label,
    fontWeight: "600",
    color: colors.primary,
    marginBottom: spacing.xs,
  },
  candidateInfoId: {
    fontSize: typography.xsmall,
    color: "#666",
    lineHeight: 18,
  },
  noCandidatesContainer: {
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    padding: spacing.lg * 2,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  noCandidatesText: {
    fontSize: typography.body,
    color: "#999",
    fontWeight: "600",
  },
  submitButton: {
    width: "100%",
    height: 56,
    backgroundColor: colors.primary,
    borderRadius: radius.button,
    justifyContent: "center",
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.md,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
  submitButtonText: {
    color: "#FFF",
    fontSize: typography.body,
    fontWeight: "700",
  },
});

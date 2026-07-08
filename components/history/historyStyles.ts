import { StyleSheet } from "react-native";

/**
 * History-only chrome (badges, sync meta, accordion tray).
 * Outer card surface lives in shared `RosterCardShell` / `rosterStyles.cardShell`
 * — do not reintroduce a solid-grey card fill here.
 */
export const cardStyles = StyleSheet.create({
  cardHeaderInteractiveRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "transparent",
  },
  badgeMetadataRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "transparent",
    marginBottom: 6,
  },
  badgePill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginRight: 8,
  },
  badgeText: {
    fontFamily: "GoogleSansBold",
    fontSize: 9,
    color: "#FFFFFF",
  },
  metaText: {
    fontFamily: "GoogleSansBold",
    fontSize: 12,
  },
  routingSummaryText: {
    fontFamily: "GoogleSansBold",
    fontSize: 16,
    letterSpacing: -0.2,
  },
  genericDetailsText: {
    fontFamily: "GoogleSans",
    fontSize: 14,
    lineHeight: 19,
    marginTop: 2,
  },
  detailsTray: {
    backgroundColor: "transparent",
    marginTop: 10,
    width: "100%",
  },
  varianceNotes: {
    fontFamily: "GoogleSans",
    fontSize: 13,
    fontStyle: "italic",
    marginBottom: 14,
    paddingHorizontal: 2,
  },
  pipelineWrapper: {
    flexDirection: "row",
    backgroundColor: "transparent",
    width: "100%",
    position: "relative",
    marginTop: 4,
  },
  verticalTimelinePipe: {
    position: "absolute",
    left: 11,
    top: 4,
    bottom: 20,
    width: 2,
    borderRadius: 1,
  },
  rowsWrapperBlock: {
    flex: 1,
    backgroundColor: "transparent",
    paddingLeft: 32,
  },
  itineraryItemRow: {
    backgroundColor: "transparent",
    marginVertical: 8,
    width: "100%",
    position: "relative",
  },
  pipeCircleNode: {
    position: "absolute",
    left: -32,
    top: 2,
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 2,
  },
  elementDataBlock: {
    backgroundColor: "transparent",
    flex: 1,
  },
  itemMetaLine: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "transparent",
    marginBottom: 3,
  },
});

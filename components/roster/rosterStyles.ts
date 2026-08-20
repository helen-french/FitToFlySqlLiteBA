/**
 * Shared styles for roster trip/ground/pipe presentational components.
 *
 * Card chrome (white / dark fill + grey border) lives on `RosterCardShell`
 * via `cardShell` — History badges stay in components/history/historyStyles.ts.
 */

import { StyleSheet } from "react-native";

export const rosterStyles = StyleSheet.create({
  // ── Standard card shell (History / Details / modal / Sectors) ────
  // White (or dark elevated) fill + grey hairline border. Do not use a
  // solid grey (#F2F2F7) fill for these cards anymore.
  cardShell: {
    width: "100%",
    borderRadius: 20,
    borderWidth: 1,
    padding: 16,
    marginBottom: 16,
    overflow: "hidden",
  },

  // ── Trip header summary ──────────────────────────────────────────
  headerBlock: {
    backgroundColor: "transparent",
    flex: 1,
  },
  dateRangeText: {
    fontFamily: "GoogleSansBold",
    fontSize: 13,
    marginBottom: 4,
  },
  routingRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "transparent",
    flexWrap: "wrap",
  },
  routingLinksRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    flex: 1,
    backgroundColor: "transparent",
  },
  routingLinkPiece: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "transparent",
  },
  routingSummaryText: {
    fontFamily: "GoogleSansBold",
    fontSize: 16,
    letterSpacing: -0.2,
  },
  metaLineText: {
    fontFamily: "GoogleSans",
    fontSize: 13,
    marginTop: 3,
  },
  tripNumberText: {
    fontFamily: "GoogleSansBold",
    fontSize: 12,
    marginTop: 4,
  },

  // ── Ground duty summary / accordion ──────────────────────────────
  groundBlock: {
    backgroundColor: "transparent",
    width: "100%",
  },
  groundTitleText: {
    fontFamily: "GoogleSansBold",
    fontSize: 16,
  },
  groundCodeText: {
    fontFamily: "GoogleSans",
    fontSize: 14,
  },
  groundAccordionHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "transparent",
    width: "100%",
  },
  groundDetailsTray: {
    backgroundColor: "transparent",
    marginTop: 0,
    width: "100%",
  },
  groundDetailsDivider: {
    borderBottomWidth: 1,
    marginBottom: 12,
    marginTop: 10,
    opacity: 0.15,
  },
  // Compact accordion body: "SWOP | 15hrs" then window line (no labels).
  // Same size as date/time line — code bolded inline; credit regular.
  groundCompactPrimary: {
    fontFamily: "GoogleSans",
    fontSize: 13,
    letterSpacing: -0.2,
  },
  groundCompactWindow: {
    fontFamily: "GoogleSans",
    fontSize: 13,
  },
  groundDetailRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    backgroundColor: "transparent",
    width: "100%",
    marginBottom: 10,
  },
  groundDetailLabel: {
    fontFamily: "GoogleSans",
    fontSize: 13,
    marginRight: 12,
  },
  groundDetailValueBlock: {
    backgroundColor: "transparent",
    flexShrink: 1,
    alignItems: "flex-end",
  },
  groundDetailValue: {
    fontFamily: "GoogleSansBold",
    fontSize: 14,
    textAlign: "right",
  },
  groundDetailSubValue: {
    fontFamily: "GoogleSans",
    fontSize: 13,
    marginTop: 2,
    textAlign: "right",
  },

  // ── Timeline pipe ────────────────────────────────────────────────
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
    paddingBottom: 4,
  },
  itemMetaLine: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "transparent",
    marginBottom: 3,
  },
  interactiveRowWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "transparent",
    width: "100%",
  },
  tabRedirectArrow: {
    padding: 8,
    marginLeft: 4,
  },
  dateLabelText: {
    fontFamily: "GoogleSansBold",
    fontSize: 14,
  },
  reportLabelText: {
    fontFamily: "GoogleSans",
    fontSize: 13,
    marginLeft: 8,
  },
  flightBodyText: {
    fontFamily: "GoogleSans",
    fontSize: 14,
  },
  flightRouteRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    backgroundColor: "transparent",
  },
  flightIataLinkRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "transparent",
  },
  flightAccentText: {
    fontFamily: "GoogleSansBold",
  },
  timeRangeText: {
    fontFamily: "GoogleSans",
    fontSize: 13,
    marginTop: 1,
  },
  layoverText: {
    fontFamily: "GoogleSans",
    fontSize: 14,
  },
});

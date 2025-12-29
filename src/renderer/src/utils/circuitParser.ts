/**
 * Circuit naming parser for power distribution
 * Supports flexible naming: "AA", "FOH-A", "DECK-B", etc.
 */

import { DimmerRack, PDRack } from '../types/power';

/**
 * Parsed circuit information
 */
export interface ParsedCircuit {
  rackIdentifier: string;
  socapexLetter: string;
  circuitNumber: number;
  actualChannelNumber: number; // Calculated from socapex and circuit number
}

/**
 * Result of linking a circuit to a rack
 */
export interface CircuitLinkResult {
  rackId: string | null;
  rackName: string | null;
  channelNumber: number | null;
  error?: string;
}

/**
 * Parse a circuit name into components
 * Supports formats:
 * - "AA" = rack "A", socapex "A"
 * - "FOH-A" = rack "FOH", socapex "A"
 * - "DECK-B" = rack "DECK", socapex "B"
 */
export function parseCircuitName(circuit: string): ParsedCircuit | null {
  if (!circuit) return null;

  const trimmed = circuit.trim().toUpperCase();

  // Check if circuit contains a separator (hyphen or underscore)
  const separatorMatch = trimmed.match(/^(.+?)[-_]([A-Z])$/);

  if (separatorMatch) {
    // Format: "FOH-A", "DECK-B", etc.
    const [, rackIdentifier, socapexLetter] = separatorMatch;
    return {
      rackIdentifier,
      socapexLetter,
      circuitNumber: 0, // Will be set from circuit_number field
      actualChannelNumber: 0 // Will be calculated
    };
  }

  // No separator - try to parse as traditional format
  // Could be "AA", "AB", "ZA", etc.
  // Assume last character is socapex, everything before is rack identifier
  if (trimmed.length >= 2) {
    const rackIdentifier = trimmed.slice(0, -1);
    const socapexLetter = trimmed.slice(-1);

    return {
      rackIdentifier,
      socapexLetter,
      circuitNumber: 0,
      actualChannelNumber: 0
    };
  }

  return null;
}

/**
 * Calculate actual channel number from socapex letter and circuit number
 * Each socapex consolidates 6 circuits
 * - Socapex A (index 0) = circuits 1-6
 * - Socapex B (index 1) = circuits 7-12
 * - etc.
 */
export function calculateChannelNumber(
  socapexLetter: string,
  circuitNumber: number
): number {
  // Convert socapex letter to index (A=0, B=1, C=2, etc.)
  const socapexIndex = socapexLetter.charCodeAt(0) - 'A'.charCodeAt(0);

  if (socapexIndex < 0) return circuitNumber;

  // If circuit number is > 6, assume it's the actual channel number (user entered it directly)
  if (circuitNumber > 6) {
    return circuitNumber;
  }

  // Otherwise, calculate from socapex: (socapex_index * 6) + circuit_number
  return (socapexIndex * 6) + circuitNumber;
}

/**
 * Link a circuit to a dimmer rack
 */
export function linkToDimmerRack(
  circuit: string,
  circuitNumber: number,
  dimmerRacks: DimmerRack[]
): CircuitLinkResult {
  const parsed = parseCircuitName(circuit);

  if (!parsed) {
    return {
      rackId: null,
      rackName: null,
      channelNumber: null,
      error: 'Invalid circuit format'
    };
  }

  // Find rack with matching identifier
  const rack = dimmerRacks.find(
    r => r.rack_identifier?.toUpperCase() === parsed.rackIdentifier
  );

  if (!rack) {
    return {
      rackId: null,
      rackName: null,
      channelNumber: null,
      error: `No dimmer rack found with identifier "${parsed.rackIdentifier}"`
    };
  }

  // Calculate actual channel number
  const actualChannel = calculateChannelNumber(parsed.socapexLetter, circuitNumber);

  // Validate channel is within rack capacity
  if (actualChannel > rack.circuit_count) {
    return {
      rackId: null,
      rackName: null,
      channelNumber: null,
      error: `Channel ${actualChannel} exceeds rack capacity of ${rack.circuit_count}`
    };
  }

  return {
    rackId: rack.id,
    rackName: rack.name,
    channelNumber: actualChannel,
  };
}

/**
 * Link a circuit to a PD rack
 */
export function linkToPDRack(
  circuit: string,
  circuitNumber: number,
  pdRacks: PDRack[]
): CircuitLinkResult {
  const parsed = parseCircuitName(circuit);

  if (!parsed) {
    return {
      rackId: null,
      rackName: null,
      channelNumber: null,
      error: 'Invalid circuit format'
    };
  }

  // Find rack with matching identifier
  const rack = pdRacks.find(
    r => r.rack_identifier?.toUpperCase() === parsed.rackIdentifier
  );

  if (!rack) {
    return {
      rackId: null,
      rackName: null,
      channelNumber: null,
      error: `No PD rack found with identifier "${parsed.rackIdentifier}"`
    };
  }

  // Calculate actual circuit number
  const actualCircuit = calculateChannelNumber(parsed.socapexLetter, circuitNumber);

  // Validate circuit is within rack capacity
  if (actualCircuit > rack.circuit_count) {
    return {
      rackId: null,
      rackName: null,
      channelNumber: null,
      error: `Circuit ${actualCircuit} exceeds rack capacity of ${rack.circuit_count}`
    };
  }

  return {
    rackId: rack.id,
    rackName: rack.name,
    channelNumber: actualCircuit,
  };
}

/**
 * Auto-link a fixture based on its circuit and circuit_number fields
 * Determines if it's a dimmer or PD circuit and links accordingly
 */
export function autoLinkCircuit(
  circuit: string,
  circuitNumber: number,
  dimmerRacks: DimmerRack[],
  pdRacks: PDRack[]
): {
  dimmer_rack_id?: string;
  dimmer_channel_number?: number;
  pd_rack_id?: string;
  pd_circuit_number?: number;
  error?: string;
} {
  if (!circuit || !circuitNumber) {
    return {};
  }

  // Try dimmer racks first
  const dimmerResult = linkToDimmerRack(circuit, circuitNumber, dimmerRacks);
  if (dimmerResult.rackId) {
    return {
      dimmer_rack_id: dimmerResult.rackId,
      dimmer_channel_number: dimmerResult.channelNumber!,
    };
  }

  // Try PD racks
  const pdResult = linkToPDRack(circuit, circuitNumber, pdRacks);
  if (pdResult.rackId) {
    return {
      pd_rack_id: pdResult.rackId,
      pd_circuit_number: pdResult.channelNumber!,
    };
  }

  // No match found
  return {
    error: dimmerResult.error || pdResult.error || 'No matching rack found'
  };
}

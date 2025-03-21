// src/components/scoring/ScoreModals.tsx
import React from 'react';
import { useDispatch } from 'react-redux';

import PartnershipModal from '@/components/scoring/modals/PartnershipModal';
import ExtrasModal from '@/components/scoring/modals/ExtrasModal';
import AdvancedScoringModal from '@/components/scoring/modals/AdvancedScoringModal';
import NextBowlerModal from '@/components/scoring/modals/NextBowlerModal';
import WicketModal from '@/components/scoring/modals/WicketModal';
import EndInningsModal from '@/components/scoring/modals/EndInningsModal';

import { Team, InningsData } from '@/types';
import { addExtraRuns } from '@/store/cricket/scoreboardSlice';

interface ScoreModalsProps {
    // Partnerships
    showPartnershipModal: boolean;
    setShowPartnershipModal: (v: boolean) => void;
    // Extras
    showExtrasModal: boolean;
    setShowExtrasModal: (v: boolean) => void;
    // Advanced
    showAdvancedModal: boolean;
    setShowAdvancedModal: (v: boolean) => void;
    // Bowler
    showBowlerModal: boolean;
    setShowBowlerModal: (v: boolean) => void;
    bowlingTeam: Team;
    currentBowlerId?: string;
    lastOverBowlerId?: string;
    onSelectBowler: (bowlerId: string) => void;
    // Wicket
    showWicketModal: boolean;
    setShowWicketModal: (v: boolean) => void;
    handleWicketConfirm: (data: any) => void;
    battingTeam: Team;
    currentStrikerId: string;
    currentNonStrikerId: string;
    battingTeamKey: 'teamA' | 'teamB';
    // End Innings
    showEndInningsModal: boolean;
    setShowEndInningsModal: (v: boolean) => void;
    handleEndInningsConfirm: () => void;
    // Partnerships
    currentInnings: InningsData; //  | null
    totalPlayers: number;
}

export function ScoreModals(props: ScoreModalsProps) {
    const {
        showPartnershipModal,
        setShowPartnershipModal,
        showExtrasModal,
        setShowExtrasModal,
        showAdvancedModal,
        setShowAdvancedModal,
        showBowlerModal,
        setShowBowlerModal,
        bowlingTeam,
        currentBowlerId,
        lastOverBowlerId,
        onSelectBowler,
        showWicketModal,
        setShowWicketModal,
        handleWicketConfirm,
        battingTeam,
        currentStrikerId,
        currentNonStrikerId,
        battingTeamKey,
        showEndInningsModal,
        setShowEndInningsModal,
        handleEndInningsConfirm,
        currentInnings,
        totalPlayers
    } = props;

    const dispatch = useDispatch();

    return (
        <>
            <PartnershipModal
                visible={showPartnershipModal}
                onClose={() => setShowPartnershipModal(false)}
                battingTeam={battingTeam}
                currentInnings={currentInnings}
            />

            <ExtrasModal
                visible={showExtrasModal}
                onClose={() => setShowExtrasModal(false)}
                onAddExtras={(runs) => {
                    // Dispatch the addExtraRuns action when user confirms extras
                    dispatch(addExtraRuns(runs));
                    // Optionally close the modal, or let the caller do it
                    setShowExtrasModal(false);
                }}
            />

            <AdvancedScoringModal
                visible={showAdvancedModal}
                onClose={() => setShowAdvancedModal(false)}
                onScore={() => { }}
            />

            <NextBowlerModal
                visible={showBowlerModal}
                onClose={() => setShowBowlerModal(false)}
                bowlingTeam={bowlingTeam}
                currentBowlerId={currentBowlerId}
                lastOverBowlerId={lastOverBowlerId}
                onSelectBowler={onSelectBowler}
            />

            <WicketModal
                visible={showWicketModal}
                onClose={() => setShowWicketModal(false)}
                onConfirm={handleWicketConfirm}
                battingTeam={battingTeam}
                bowlingTeam={bowlingTeam}
                currentStrikerId={currentStrikerId}
                currentNonStrikerId={currentNonStrikerId}
                battingTeamKey={battingTeamKey}
                totalPlayers={totalPlayers}
            />

            <EndInningsModal
                visible={showEndInningsModal}
                onClose={() => setShowEndInningsModal(false)}
                onConfirm={handleEndInningsConfirm}
            />
        </>
    );
}
package com.lockedin.scoring.dto;

import com.lockedin.scoring.ScoreReason;
import java.time.LocalDate;

/** One line of "why do I have this many points". */
public record ScoreEventResponse(LocalDate date, int points, ScoreReason reason) {
}

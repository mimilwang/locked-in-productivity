package com.lockedin.account.dto;

/** A past title. title is "MVP" or "CHUD"; month is "yyyy-MM". */
public record TitleResponse(String title, Long leagueId, String leagueName, String month) {
}

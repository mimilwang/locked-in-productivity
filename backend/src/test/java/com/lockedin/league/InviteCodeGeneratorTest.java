package com.lockedin.league;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

import org.junit.jupiter.api.Test;

class InviteCodeGeneratorTest {

    @Test
    void codesAreSixCharactersWithNoLookAlikes() {
        InviteCodeGenerator generator = new InviteCodeGenerator();
        for (int i = 0; i < 500; i++) {
            String code = generator.generate();
            assertEquals(6, code.length());
            for (char c : code.toCharArray()) {
                assertTrue(InviteCodeGenerator.ALPHABET.indexOf(c) >= 0);
                assertTrue("0O1IL".indexOf(c) < 0);
            }
        }
    }
}

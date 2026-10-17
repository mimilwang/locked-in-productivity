package com.lockedin.league;

import java.security.SecureRandom;
import org.springframework.stereotype.Component;

/** Short, easy-to-type invite codes like "K7QX2M". Skips look-alike characters (0/O, 1/I/L). */
@Component
public class InviteCodeGenerator {

    static final String ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
    static final int LENGTH = 6;

    private final SecureRandom random = new SecureRandom();

    public String generate() {
        StringBuilder code = new StringBuilder(LENGTH);
        for (int i = 0; i < LENGTH; i++) {
            code.append(ALPHABET.charAt(random.nextInt(ALPHABET.length())));
        }
        return code.toString();
    }
}

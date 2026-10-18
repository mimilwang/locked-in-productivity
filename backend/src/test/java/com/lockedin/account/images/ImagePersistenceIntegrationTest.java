package com.lockedin.account.images;

import static org.junit.jupiter.api.Assertions.assertArrayEquals;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.util.Map;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

/**
 * Profile pictures must be stored with the user (DB-backed image + users.profile_photo_url)
 * so a laptop upload is visible when the same account opens Locked In on a phone.
 */
@SpringBootTest
@AutoConfigureMockMvc
@Transactional
class ImagePersistenceIntegrationTest {

    private static final byte[] TINY_PNG = new byte[] {
            (byte) 0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 0x00, 0x00, 0x00, 0x0D,
            0x49, 0x48, 0x44, 0x52, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
            0x08, 0x02, 0x00, 0x00, 0x00, (byte) 0x90, 0x77, 0x53, (byte) 0xDE, 0x00, 0x00,
            0x00, 0x0C, 0x49, 0x44, 0x41, 0x54, 0x08, (byte) 0xD7, 0x63, (byte) 0xF8, (byte) 0xCF,
            (byte) 0xC0, 0x00, 0x00, 0x00, 0x03, 0x00, 0x01, 0x00, 0x05, (byte) 0xFE, (byte) 0xD4,
            (byte) 0xEF, 0x00, 0x00, 0x00, 0x00, 0x49, 0x45, 0x4E, 0x44, (byte) 0xAE, 0x42,
            0x60, (byte) 0x82
    };

    @Autowired
    MockMvc mvc;
    @Autowired
    ObjectMapper json;
    @Autowired
    StoredImageRepository images;

    @Test
    void uploadAttachesToProfileAndLoadsWithoutAuth() throws Exception {
        JsonNode auth = signUp("PhotoUser");
        String token = "Bearer " + auth.get("token").asText();

        MockMultipartFile file = new MockMultipartFile(
                "file", "avatar.png", "image/png", TINY_PNG);

        String uploadBody = mvc.perform(multipart("/images").file(file).header("Authorization", token))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.url").exists())
                .andReturn().getResponse().getContentAsString();
        String photoUrl = json.readTree(uploadBody).get("url").asText();
        assertTrue(photoUrl.startsWith("/images/"));

        String filename = photoUrl.substring("/images/".length());
        assertTrue(images.findById(filename).isPresent(), "image bytes must be in the database");

        mvc.perform(patch("/users/me").header("Authorization", token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json.writeValueAsString(Map.of("photoUrl", photoUrl))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.photoUrl").value(photoUrl));

        // Second client (e.g. phone login) loads the same profile photo URL from the API.
        mvc.perform(get("/users/me").header("Authorization", token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.photoUrl").value(photoUrl));

        // Image GET is public so <img src> works across devices without attaching a JWT.
        byte[] returned = mvc.perform(get(photoUrl))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsByteArray();
        assertArrayEquals(TINY_PNG, returned);
        assertEquals("image/png", mvc.perform(get(photoUrl)).andReturn().getResponse().getContentType());
    }

    private JsonNode signUp(String name) throws Exception {
        String body = json.writeValueAsString(Map.of(
                "name", name, "displayName", name.toLowerCase(), "email", name.toLowerCase() + "@test.com",
                "password", "password123", "timeZone", "America/Los_Angeles"));
        String response = mvc.perform(post("/auth/signup").contentType(MediaType.APPLICATION_JSON).content(body))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        return json.readTree(response);
    }
}

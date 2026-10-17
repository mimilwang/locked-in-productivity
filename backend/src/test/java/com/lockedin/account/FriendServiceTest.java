package com.lockedin.account;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

import com.lockedin.TestFixtures;
import com.lockedin.account.auth.AuthService;
import com.lockedin.account.dto.FriendResponse;
import com.lockedin.account.dto.SendFriendRequest;
import com.lockedin.account.friends.FriendService;
import com.lockedin.account.friends.FriendshipStatus;
import com.lockedin.common.ApiException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.HttpStatus;
import org.springframework.transaction.annotation.Transactional;

@SpringBootTest
@Transactional
class FriendServiceTest {

    @Autowired
    AuthService auth;
    @Autowired
    FriendService friends;

    Long renee;
    Long mimi;
    Long jake;

    @BeforeEach
    void setUp() {
        renee = TestFixtures.newUser(auth, "Renee");
        mimi = TestFixtures.newUser(auth, "Mimi");
        jake = TestFixtures.newUser(auth, "Jake");
    }

    @Test
    void cannotAddYourself() {
        ApiException e = assertThrows(ApiException.class, () -> friends.sendRequest(renee, new SendFriendRequest(renee, null)));
        assertEquals(HttpStatus.BAD_REQUEST, e.getStatus());
    }

    @Test
    void cannotSendTheSameRequestTwice() {
        friends.sendRequest(renee, new SendFriendRequest(mimi, null));
        ApiException e = assertThrows(ApiException.class, () -> friends.sendRequest(renee, new SendFriendRequest(mimi, null)));
        assertEquals(HttpStatus.CONFLICT, e.getStatus());
    }

    @Test
    void canAddByEmail() {
        FriendResponse r = friends.sendRequest(renee, new SendFriendRequest(null, "mimi@test.com"));
        assertEquals(mimi, r.userId());
        assertEquals(FriendshipStatus.PENDING, r.status());
    }

    @Test
    void acceptingMakesBothPeopleFriends() {
        FriendResponse request = friends.sendRequest(renee, new SendFriendRequest(mimi, null));
        assertEquals(1, friends.incomingRequests(mimi).size());

        friends.accept(mimi, request.requestId());

        assertEquals(mimi, friends.listFriends(renee).get(0).userId());
        assertEquals(renee, friends.listFriends(mimi).get(0).userId());
        assertEquals(0, friends.incomingRequests(mimi).size());
    }

    @Test
    void sendingBackAPendingRequestAcceptsIt() {
        friends.sendRequest(renee, new SendFriendRequest(mimi, null));
        FriendResponse r = friends.sendRequest(mimi, new SendFriendRequest(renee, null));
        assertEquals(FriendshipStatus.ACCEPTED, r.status());
        assertEquals(1, friends.listFriends(renee).size());
    }

    @Test
    void onlyThePersonAskedCanAccept() {
        FriendResponse request = friends.sendRequest(renee, new SendFriendRequest(mimi, null));
        ApiException e = assertThrows(ApiException.class, () -> friends.accept(jake, request.requestId()));
        assertEquals(HttpStatus.FORBIDDEN, e.getStatus());
    }

    @Test
    void declinedRequestsCanBeSentAgain() {
        FriendResponse request = friends.sendRequest(renee, new SendFriendRequest(mimi, null));
        friends.decline(mimi, request.requestId());
        FriendResponse again = friends.sendRequest(renee, new SendFriendRequest(mimi, null));
        assertEquals(FriendshipStatus.PENDING, again.status());
    }
}

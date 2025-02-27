 const messaging = firebase.messaging();
  const fcmToken = await messaging.getToken();

  if (!fcmToken) {
    console.log("FcmNotifications: can't get fcm token");
    return;
  }

  convoClient.setPushRegistrationId("fcm", fcmToken);
  messaging.onMessage((payload) => {
    console.log("FcmNotifications: push received", payload);
    console.log({ payload });
    if (convoClient) {
      convoClient.handlePushNotification(payload);
    }
  });
};
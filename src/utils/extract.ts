 const messaging = firebase.messaging();
  console.log({ messaging });
  const fcmToken = await messaging.getToken();
  console.log({ fcmToken });

  if (!fcmToken) {
    console.log("FcmNotifications: can't get fcm token");
    return;
  }

  console.log("FcmNotifications: got fcm token", fcmToken);
  convoClient.setPushRegistrationId("fcm", fcmToken);
  messaging.onMessage((payload) => {
    console.log("FcmNotifications: push received", payload);
    console.log({ payload });
    if (convoClient) {
      convoClient.handlePushNotification(payload);
    }
  });
};
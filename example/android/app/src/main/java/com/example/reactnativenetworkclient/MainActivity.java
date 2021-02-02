package com.example.reactnativenetworkclient;

import android.os.Bundle;

import com.facebook.react.ReactActivity;
import com.hunter.library.okhttp.OkHttpHooker;
import com.mattermost.networkclient.interceptors.GlobalInterceptor;

public class MainActivity extends ReactActivity {

  /**
   * Returns the name of the main component registered from JavaScript. This is used to schedule
   * rendering of the component.
   */
  @Override
  protected String getMainComponentName() {
    return "NetworkClientExample";
  }

  @Override
  protected void onCreate(Bundle savedInstanceState) {
    super.onCreate(savedInstanceState);
    OkHttpHooker.installInterceptor(new GlobalInterceptor());
  }

}

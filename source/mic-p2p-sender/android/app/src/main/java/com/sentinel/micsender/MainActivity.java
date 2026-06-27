package com.sentinel.micsender;

import android.os.Bundle;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(BackgroundServicePlugin.class);
        super.onCreate(savedInstanceState);
    }
}

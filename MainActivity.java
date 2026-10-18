package com.tobus.app;

import android.annotation.SuppressLint;
import android.os.Bundle;
import android.graphics.Color;
import android.view.Gravity;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.TextView;

import androidx.activity.OnBackPressedCallback;
import androidx.appcompat.app.AppCompatActivity;

public class MainActivity extends AppCompatActivity {

    private WebView webView;

    @SuppressLint("SetJavaScriptEnabled")
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        try {
            webView = new WebView(this);
            setContentView(webView);

            WebSettings settings = webView.getSettings();

            settings.setJavaScriptEnabled(true);
            settings.setDomStorageEnabled(true);
            settings.setAllowFileAccess(true);
            settings.setAllowContentAccess(true);
            settings.setMediaPlaybackRequiresUserGesture(false);

            webView.setWebViewClient(new WebViewClient());

            webView.loadUrl("file:///android_asset/www/index.html");

            getOnBackPressedDispatcher().addCallback(
                this,
                new OnBackPressedCallback(true) {
                    @Override
                    public void handleOnBackPressed() {
                        if (webView != null && webView.canGoBack()) {
                            webView.goBack();
                        } else {
                            finish();
                        }
                    }
                }
            );

        } catch (Throwable error) {

            TextView errorView = new TextView(this);

            errorView.setText(
                "TO BUS - ERRO AO INICIAR\n\n" +
                error.getClass().getName() +
                "\n\n" +
                error.getMessage()
            );

            errorView.setTextColor(Color.WHITE);
            errorView.setBackgroundColor(Color.rgb(8, 20, 38));
            errorView.setTextSize(16);
            errorView.setPadding(40, 60, 40, 60);
            errorView.setGravity(Gravity.CENTER_VERTICAL);

            setContentView(errorView);
        }
    }
}

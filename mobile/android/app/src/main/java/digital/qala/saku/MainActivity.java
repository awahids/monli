package digital.qala.saku;

import android.os.Bundle;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {

    @Override
    public void onCreate(Bundle savedInstanceState) {
        // Our own plugins, which live in this app rather than in node_modules.
        registerPlugin(WidgetBridgePlugin.class);
        super.onCreate(savedInstanceState);
    }
}

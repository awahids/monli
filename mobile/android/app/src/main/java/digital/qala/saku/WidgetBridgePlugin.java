package digital.qala.saku;

import android.appwidget.AppWidgetManager;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

/**
 * Hands the home screen widget its numbers. The site calls update() from
 * Beranda (lib/widget.ts in the web repo); the widget shows them until the
 * next call.
 */
@CapacitorPlugin(name = "WidgetBridge")
public class WidgetBridgePlugin extends Plugin {

    @PluginMethod
    public void update(PluginCall call) {
        Context context = getContext();
        context.getSharedPreferences(SakuWidgetProvider.PREFS, Context.MODE_PRIVATE)
            .edit()
            .putString("label", call.getString("label", ""))
            .putString("value", call.getString("value", ""))
            .putString("detail", call.getString("detail", ""))
            .putString("updated", call.getString("updated", ""))
            .apply();

        AppWidgetManager manager = AppWidgetManager.getInstance(context);
        int[] ids = manager.getAppWidgetIds(new ComponentName(context, SakuWidgetProvider.class));
        Intent refresh = new Intent(context, SakuWidgetProvider.class);
        refresh.setAction(AppWidgetManager.ACTION_APPWIDGET_UPDATE);
        refresh.putExtra(AppWidgetManager.EXTRA_APPWIDGET_IDS, ids);
        context.sendBroadcast(refresh);
        call.resolve();
    }
}

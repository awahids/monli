package digital.qala.saku;

import android.app.PendingIntent;
import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.net.Uri;
import android.widget.RemoteViews;

/**
 * Home screen widget: today's allowance (or today's spending) as last sent by
 * the app, and a "+ Catat" button. Tapping opens the app; the button opens
 * the add form through qalasaku://add.
 */
public class SakuWidgetProvider extends AppWidgetProvider {

    static final String PREFS = "qala_widget";

    @Override
    public void onUpdate(Context context, AppWidgetManager manager, int[] ids) {
        SharedPreferences prefs = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE);
        for (int id : ids) {
            RemoteViews views = new RemoteViews(context.getPackageName(), R.layout.widget_saku);
            String value = prefs.getString("value", "");
            if (value.isEmpty()) {
                // Nothing sent yet: the app has not been opened since installing the widget.
                views.setTextViewText(R.id.widget_label, context.getString(R.string.app_name));
                views.setTextViewText(R.id.widget_value, "—");
                views.setTextViewText(R.id.widget_detail, context.getString(R.string.widget_open_app));
                views.setTextViewText(R.id.widget_updated, "");
            } else {
                views.setTextViewText(R.id.widget_label, prefs.getString("label", ""));
                views.setTextViewText(R.id.widget_value, value);
                views.setTextViewText(R.id.widget_detail, prefs.getString("detail", ""));
                views.setTextViewText(R.id.widget_updated, prefs.getString("updated", ""));
            }
            views.setOnClickPendingIntent(R.id.widget_root, link(context, "qalasaku://open", 0));
            views.setOnClickPendingIntent(R.id.widget_add, link(context, "qalasaku://add", 1));
            manager.updateAppWidget(id, views);
        }
    }

    private static PendingIntent link(Context context, String uri, int requestCode) {
        Intent intent = new Intent(Intent.ACTION_VIEW, Uri.parse(uri), context, MainActivity.class);
        intent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_SINGLE_TOP);
        return PendingIntent.getActivity(
            context,
            requestCode,
            intent,
            PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
        );
    }
}

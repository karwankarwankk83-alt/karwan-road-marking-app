package com.ks.roadmarking.armeter

import android.opengl.Matrix
import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.Text
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.layout.onSizeChanged
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.IntSize
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.google.ar.core.Config
import com.google.ar.core.Frame
import com.google.ar.core.HitResult
import com.google.ar.core.Plane
import com.google.ar.core.Pose
import com.google.ar.core.TrackingState
import io.github.sceneview.ar.ARSceneView
import java.util.Locale
import kotlin.math.sqrt

enum class MeasureStep { START, END, DONE }

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContent { MaterialTheme { NativeArMeter() } }
    }
}

@Composable
private fun NativeArMeter() {
    var size by remember { mutableStateOf(IntSize.Zero) }
    var latestFrame by remember { mutableStateOf<Frame?>(null) }

    var step by remember { mutableStateOf(MeasureStep.START) }
    var startPose by remember { mutableStateOf<Pose?>(null) }
    var endPose by remember { mutableStateOf<Pose?>(null) }
    var startPlane by remember { mutableStateOf<Plane?>(null) }

    var currentPlane by remember { mutableStateOf<Plane?>(null) }
    var currentPose by remember { mutableStateOf<Pose?>(null) }
    var ready by remember { mutableStateOf(false) }
    var spreadCm by remember { mutableDoubleStateOf(999.0) }
    var status by remember { mutableStateOf("کامێرا هێواش بجوڵێنە تا ڕووەکە جێگیر بێت") }

    var startScreen by remember { mutableStateOf<Offset?>(null) }
    var endScreen by remember { mutableStateOf<Offset?>(null) }

    val samples = remember { ArrayDeque<Pose>() }
    var samplePlane: Plane? by remember { mutableStateOf(null) }

    fun planeHit(frame: Frame): HitResult? {
        if (size.width <= 0 || size.height <= 0) return null
        if (frame.camera.trackingState != TrackingState.TRACKING) return null

        return frame.hitTest(size.width / 2f, size.height / 2f)
            .firstOrNull { hit ->
                val plane = hit.trackable as? Plane ?: return@firstOrNull false
                plane.trackingState == TrackingState.TRACKING &&
                    plane.subsumedBy == null &&
                    plane.isPoseInPolygon(hit.hitPose)
            }
    }

    fun medianPose(list: Collection<Pose>): Pose? {
        if (list.isEmpty()) return null
        fun median(values: List<Float>): Float {
            val s = values.sorted()
            val n = s.size
            return if (n % 2 == 1) s[n / 2] else (s[n / 2 - 1] + s[n / 2]) / 2f
        }
        val x = median(list.map { it.tx() })
        val y = median(list.map { it.ty() })
        val z = median(list.map { it.tz() })
        return Pose.makeTranslation(x, y, z)
    }

    fun distance(a: Pose, b: Pose): Double {
        val dx = (a.tx() - b.tx()).toDouble()
        val dy = (a.ty() - b.ty()).toDouble()
        val dz = (a.tz() - b.tz()).toDouble()
        return sqrt(dx * dx + dy * dy + dz * dz)
    }

    fun spreadMeters(center: Pose?, list: Collection<Pose>): Double {
        center ?: return 999.0
        if (list.isEmpty()) return 999.0
        return list.maxOf { distance(center, it) }
    }

    fun projectPose(pose: Pose?, frame: Frame): Offset? {
        pose ?: return null
        if (size.width <= 0 || size.height <= 0) return null

        val view = FloatArray(16)
        val proj = FloatArray(16)
        val vp = FloatArray(16)
        val world = floatArrayOf(pose.tx(), pose.ty(), pose.tz(), 1f)
        val clip = FloatArray(4)

        frame.camera.getViewMatrix(view, 0)
        frame.camera.getProjectionMatrix(proj, 0, 0.05f, 100f)
        Matrix.multiplyMM(vp, 0, proj, 0, view, 0)
        Matrix.multiplyMV(clip, 0, vp, 0, world, 0)
        if (clip[3] <= 0.0001f) return null

        val nx = clip[0] / clip[3]
        val ny = clip[1] / clip[3]
        return Offset(
            (nx * 0.5f + 0.5f) * size.width,
            (1f - (ny * 0.5f + 0.5f)) * size.height
        )
    }

    fun resetMeasurement() {
        step = MeasureStep.START
        startPose = null
        endPose = null
        startPlane = null
        startScreen = null
        endScreen = null
        samples.clear()
        samplePlane = null
        currentPose = null
        ready = false
        status = "کامێرا هێواش بجوڵێنە تا ڕووەکە جێگیر بێت"
    }

    val shownDistance = when {
        startPose != null && step == MeasureStep.END && currentPose != null && currentPlane == startPlane ->
            distance(startPose!!, currentPose!!)
        startPose != null && endPose != null -> distance(startPose!!, endPose!!)
        else -> 0.0
    }

    Box(
        Modifier
            .fillMaxSize()
            .background(Color.Black)
            .onSizeChanged { size = it }
    ) {
        ARSceneView(
            modifier = Modifier.fillMaxSize(),
            planeRenderer = false,
            sessionConfiguration = { session, config ->
                config.planeFindingMode = Config.PlaneFindingMode.HORIZONTAL_AND_VERTICAL
                if (session.isDepthModeSupported(Config.DepthMode.AUTOMATIC)) {
                    config.depthMode = Config.DepthMode.AUTOMATIC
                }
                config.updateMode = Config.UpdateMode.LATEST_CAMERA_IMAGE
            },
            onSessionUpdated = { _, frame ->
                latestFrame = frame

                val hit = planeHit(frame)
                val plane = hit?.trackable as? Plane

                if (hit == null || plane == null) {
                    samples.clear()
                    samplePlane = null
                    currentPlane = null
                    currentPose = null
                    ready = false
                    spreadCm = 999.0
                    status = if (frame.camera.trackingState == TrackingState.TRACKING) {
                        "ڕووەکە هێشتا جێگیر نییە؛ کامێرا هێواش بجوڵێنە"
                    } else {
                        "AR هێشتا جێگیر نەبووە؛ کامێرا هێواش بجوڵێنە"
                    }
                } else {
                    if (samplePlane != plane) {
                        samples.clear()
                        samplePlane = plane
                    }

                    samples.addLast(hit.hitPose)
                    while (samples.size > 12) samples.removeFirst()

                    val median = medianPose(samples)
                    val spread = spreadMeters(median, samples)
                    currentPlane = plane
                    currentPose = median
                    spreadCm = spread * 100.0

                    val enoughSamples = samples.size >= 8
                    val stableAim = spread <= 0.018
                    val samePlaneOk = step != MeasureStep.END || startPlane == plane
                    ready = enoughSamples && stableAim && samePlaneOk

                    status = when {
                        step == MeasureStep.END && startPlane != plane ->
                            "کۆتایی دەبێت لە هەمان ڕووەکی خاڵی سەرەتا بێت"
                        !enoughSamples -> "هەندێک چرکە ڕابگرە بۆ جێگیرکردنی خاڵ"
                        !stableAim -> "کامێرا/نیشانەکە زۆر دەجوڵێت؛ کەمێک جێگیری بکە"
                        step == MeasureStep.START -> "ئامادەیە ✓ خاڵی سەرەتا تۆمار بکە"
                        step == MeasureStep.END -> "ئامادەیە ✓ خاڵی کۆتایی تۆمار بکە"
                        else -> "پێوانە تەواو بوو ✓"
                    }
                }

                if (startPose != null) startScreen = projectPose(startPose, frame)
                if (endPose != null) endScreen = projectPose(endPose, frame)
            }
        )

        Canvas(Modifier.fillMaxSize()) {
            val center = Offset(size.width / 2f, size.height / 2f)
            val crossColor = if (ready) Color(0xFF55E58D) else Color(0xFFFFD45A)

            drawCircle(crossColor.copy(alpha = 0.16f), radius = 28f, center = center)
            drawLine(crossColor, Offset(center.x - 18f, center.y), Offset(center.x + 18f, center.y), 3f)
            drawLine(crossColor, Offset(center.x, center.y - 18f), Offset(center.x, center.y + 18f), 3f)
            drawCircle(crossColor, radius = 4f, center = center)

            val s = startScreen
            val e = when {
                step == MeasureStep.END && ready -> center
                endScreen != null -> endScreen
                else -> null
            }

            if (s != null && e != null) {
                drawLine(Color.White.copy(alpha = 0.82f), s, e, strokeWidth = 4f)
            }
            if (s != null) {
                drawCircle(Color(0xFF18D276), radius = 12f, center = s)
                drawCircle(Color.White, radius = 16f, center = s, style = Stroke(width = 3f))
            }
            if (endScreen != null) {
                drawCircle(Color(0xFFFF4B55), radius = 12f, center = endScreen!!)
                drawCircle(Color.White, radius = 16f, center = endScreen!!, style = Stroke(width = 3f))
            }
        }

        Column(
            Modifier
                .fillMaxWidth()
                .padding(horizontal = 16.dp, vertical = 22.dp),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            Box(
                Modifier
                    .fillMaxWidth()
                    .background(Color(0xDD101514), RoundedCornerShape(22.dp))
                    .padding(16.dp)
            ) {
                Column(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalAlignment = Alignment.CenterHorizontally
                ) {
                    Text("KS AR Meter V2", color = Color(0xFF9FF0C0), fontSize = 14.sp, fontWeight = FontWeight.Bold)
                    Spacer(Modifier.height(4.dp))
                    Text("درێژی", color = Color.White, fontSize = 18.sp)
                    Text(
                        String.format(Locale.US, "%.3f m", shownDistance),
                        color = Color.White,
                        fontSize = 42.sp,
                        fontWeight = FontWeight.SemiBold
                    )
                    Text(
                        if (shownDistance < 1.0) String.format(Locale.US, "%.1f cm", shownDistance * 100.0) else "",
                        color = Color(0xFFB8C8C2),
                        fontSize = 16.sp
                    )
                    Spacer(Modifier.height(6.dp))
                    Text(status, color = Color(0xFFD7E0DD), fontSize = 13.sp)
                    if (spreadCm < 99.0) {
                        Text(
                            String.format(Locale.US, "جێگیری خاڵ: ±%.1f cm", spreadCm),
                            color = if (ready) Color(0xFF8EE7B2) else Color(0xFFFFD166),
                            fontSize = 12.sp
                        )
                    }
                }
            }
        }

        Column(
            Modifier
                .align(Alignment.BottomCenter)
                .fillMaxWidth()
                .padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(10.dp)
        ) {
            val buttonText = when (step) {
                MeasureStep.START -> "① خاڵی سەرەتا تۆمار بکە"
                MeasureStep.END -> "② خاڵی کۆتایی تۆمار بکە"
                MeasureStep.DONE -> "✓ پێوانە تەواو بوو"
            }

            Button(
                onClick = {
                    val pose = currentPose
                    val plane = currentPlane
                    if (!ready || pose == null || plane == null) return@Button

                    when (step) {
                        MeasureStep.START -> {
                            startPose = pose
                            startPlane = plane
                            endPose = null
                            step = MeasureStep.END
                            samples.clear()
                            samplePlane = plane
                            ready = false
                            status = "خاڵی سەرەتا تۆمارکرا ✓ نیشانەکە بەرەو خاڵی کۆتایی ببە"
                        }
                        MeasureStep.END -> {
                            if (plane != startPlane) {
                                status = "هەمان ڕووەک هەڵبژێرە؛ پێوانە ڕەتکرایەوە"
                                return@Button
                            }
                            val d = distance(startPose!!, pose)
                            if (d < 0.01) {
                                status = "خاڵی کۆتایی زۆر نزیکە؛ شوێنێکی تر هەڵبژێرە"
                                return@Button
                            }
                            if (d > 50.0) {
                                status = "پێوانەکە نامۆیە (>50m) و ڕەتکرایەوە؛ دووبارە بکەرەوە"
                                return@Button
                            }
                            endPose = pose
                            step = MeasureStep.DONE
                            status = "پێوانە تەواو بوو ✓ سەوز = سەرەتا، سور = کۆتایی"
                        }
                        MeasureStep.DONE -> Unit
                    }
                },
                enabled = ready && step != MeasureStep.DONE,
                modifier = Modifier.fillMaxWidth().height(64.dp),
                colors = ButtonDefaults.buttonColors(
                    containerColor = Color(0xFF168F57),
                    disabledContainerColor = Color(0xFF38413E)
                ),
                shape = RoundedCornerShape(18.dp)
            ) {
                Text(buttonText, fontSize = 17.sp, fontWeight = FontWeight.Bold)
            }

            OutlinedButton(
                onClick = { resetMeasurement() },
                modifier = Modifier.fillMaxWidth().height(52.dp),
                shape = RoundedCornerShape(16.dp)
            ) {
                Text("دووبارە / Reset", color = Color.White)
            }

            Box(
                Modifier
                    .fillMaxWidth()
                    .background(Color(0xC9141817), RoundedCornerShape(14.dp))
                    .padding(horizontal = 12.dp, vertical = 9.dp)
            ) {
                Text(
                    "پێش کاری پڕۆژە: یەکجار بە قیاسی ناسراوی 0.50m یان 1.00m تاقی بکەرەوە. ئەگەر ئەنجام جێگیر نەبوو، پێوانە قبوڵ مەکە.",
                    color = Color(0xFFD4DDD9),
                    fontSize = 11.sp
                )
            }
        }
    }
}

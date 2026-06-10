import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';

class MobileWebFrame extends StatelessWidget {
  final Widget child;

  const MobileWebFrame({
    super.key,
    required this.child,
  });

  static const double phoneWidth = 430;

  @override
  Widget build(BuildContext context) {
    if (!kIsWeb) return child;

    return LayoutBuilder(
      builder: (context, constraints) {
        if (constraints.maxWidth <= phoneWidth) {
          return child;
        }

        final mediaQuery = MediaQuery.of(context);

        return Container(
          color: const Color(0xFF3B424B),
          alignment: Alignment.center,
          child: SizedBox(
            width: phoneWidth,
            height: constraints.maxHeight,
            child: MediaQuery(
              data: mediaQuery.copyWith(
                size: Size(phoneWidth, constraints.maxHeight),
              ),
              child: ClipRect(
                child: DecoratedBox(
                  decoration: BoxDecoration(
                    color: Colors.white,
                    boxShadow: [
                      BoxShadow(
                        color: Colors.black.withOpacity(0.25),
                        blurRadius: 24,
                      ),
                    ],
                  ),
                  child: child,
                ),
              ),
            ),
          ),
        );
      },
    );
  }
}
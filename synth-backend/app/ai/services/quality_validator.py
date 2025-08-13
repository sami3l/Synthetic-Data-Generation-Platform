import pandas as pd
from sdmetrics.reports.single_table import QualityReport
from sdv.metadata import SingleTableMetadata

class QualityValidator:
    def __init__(self):
        self.metadata = None

    def evaluate(self, real_data: pd.DataFrame, synthetic_data: pd.DataFrame) -> float:
        """
        Évalue la qualité des données synthétiques générées
        Retourne un score entre 0 et 1
        """
        try:
            # Création des métadonnées
            self.metadata = SingleTableMetadata()
            self.metadata.detect_from_dataframe(real_data)

            # Génération du rapport de qualité
            report = QualityReport()
            report.generate(
                real_data=real_data,
                synthetic_data=synthetic_data,
                metadata=self.metadata.to_dict()
            )

            # Récupération du score global
            quality_score = report.get_score()
            
            return quality_score

        except Exception as e:
            print(f"Erreur lors de l'évaluation: {str(e)}")
            return 0.0